use serde_json::Value;
use std::{
    io::{Read, Write},
    net::{TcpListener, TcpStream},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    thread,
    time::Duration,
};

pub struct MockServer {
    pub url: String,
    pub requests: Arc<Mutex<Vec<Value>>>,
    stopped: Arc<AtomicBool>,
    worker: Option<thread::JoinHandle<()>>,
}
impl MockServer {
    pub fn new(handler: impl Fn(&str, &str, &Value) -> Value + Send + 'static) -> Self {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let url = format!("http://{}", listener.local_addr().unwrap());
        listener.set_nonblocking(true).unwrap();
        let stopped = Arc::new(AtomicBool::new(false));
        let stop = stopped.clone();
        let requests = Arc::new(Mutex::new(Vec::new()));
        let captured = requests.clone();
        let worker = thread::spawn(move || {
            while !stop.load(Ordering::SeqCst) {
                match listener.accept() {
                    Ok((mut stream, _)) => {
                        stream.set_nonblocking(false).unwrap();
                        stream
                            .set_read_timeout(Some(Duration::from_secs(2)))
                            .unwrap();
                        if let Some((method, path, body)) = read_request(&mut stream) {
                            captured.lock().unwrap().push(body.clone());
                            let value = handler(&method, &path, &body).to_string();
                            let _ = write!(stream, "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nMcp-Session-Id: fixture-session\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}", value.len(), value);
                        }
                    }
                    Err(_) => thread::sleep(Duration::from_millis(5)),
                }
            }
        });
        Self {
            url,
            requests,
            stopped,
            worker: Some(worker),
        }
    }
}
fn read_request(stream: &mut TcpStream) -> Option<(String, String, Value)> {
    let mut bytes = Vec::new();
    let mut buffer = [0; 8192];
    let (end, length) = loop {
        let count = stream.read(&mut buffer).ok()?;
        if count == 0 {
            return None;
        }
        bytes.extend_from_slice(&buffer[..count]);
        if let Some(end) = bytes.windows(4).position(|w| w == b"\r\n\r\n") {
            let header = String::from_utf8_lossy(&bytes[..end]);
            let length = header
                .lines()
                .find_map(|l| {
                    l.to_ascii_lowercase()
                        .strip_prefix("content-length:")
                        .map(|s| s.trim().parse::<usize>().unwrap())
                })
                .unwrap_or(0);
            break (end + 4, length);
        }
    };
    while bytes.len() < end + length {
        let count = stream.read(&mut buffer).ok()?;
        if count == 0 {
            return None;
        }
        bytes.extend_from_slice(&buffer[..count]);
    }
    let header = String::from_utf8_lossy(&bytes[..end]);
    let mut first = header.lines().next()?.split_whitespace();
    let method = first.next()?.to_string();
    let path = first.next()?.to_string();
    let body = serde_json::from_slice(&bytes[end..end + length]).unwrap_or(Value::Null);
    Some((method, path, body))
}
impl Drop for MockServer {
    fn drop(&mut self) {
        self.stopped.store(true, Ordering::SeqCst);
        self.worker.take().unwrap().join().unwrap();
    }
}
