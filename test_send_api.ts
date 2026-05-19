import fetch from 'node-fetch';

async function test() {
  const base64Str = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBw8NDw0NDQ8NDQ0NDw0NDQ0NDw8NDQ0NFREWFxURFRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDQ0NDg0NDisZFRkrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrK//AABEIARwAlAMBIgACEQEDEQH/xAAcAAEAAQUBAQAAAAAAAAAAAAAAAQIEBQYHAwj/xAA4EAACAQIEAwUGAwABAwUAAAABAgADEQQSITEFIkEGE1FhcQcygZGhscHR8BQjQuHxJDNScoKS/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAEC/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAER/9oADAMBAAIRAxEAPwC0REEREAREQBERAEREAQZMQC3sC4kEi8kRJEBciIlyIsARaTItALdpMSIAmRaZRaQIIi0ztAiIiAIiIAiIgCIiAIiIAiSAiAJItJtJiCBERAEREAREQBERAEREAqRJEQBEkRAEkRJiCBERGgREQBERAEREAREQBERAEREAREQBERAEREA//Z';
  
  const res = await fetch('http://localhost:3000/api/whatsapp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '5511999999999',
      message: 'test',
      mediaType: 'image',
      mediaUrl: base64Str
    })
  });
  console.log(res.status, await res.text());
}
test();
