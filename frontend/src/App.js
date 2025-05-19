import logo from './logo.svg';
import './App.css';
import {useRef, useState} from "react";

function App() {
  const [image, setImage] = useState(null); //displayed image
  const [start, setStart] = useState(null);
  const [rect, setRect] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [result, setResult] = useState(null);
  const canvasRef = useRef();
  const imgRef = useRef();
  const scaleRef = useRef(1);


  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return; // don't do anything

    const reader = new FileReader();
    // when file is read
    reader.onload = (event) => {
      // save image
      const base64 = event.target.result;
      setImageData(base64);

      const img = new  Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d'); //renderer

        // Canvas Scale
        const maxWidth = window.innerWidth * 0.9;
        const maxHeight = window.innerHeight * 0.8;
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        scaleRef.current = scale;

        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // show image
        setImage(img); // load image
        imgRef.current = img; //
      };
      img.src = event.target.result; //set image
    };
    reader.readAsDataURL(file);
  };

  // get starting click position
  const onMouseDown = (e) => setStart({x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY});
  const onMouseUp = (e) => {
    if (!start) return;
    const x = Math.min(start.x, e.nativeEvent.offsetX);
    const y = Math.min(start.y, e.nativeEvent.offsetY);
    const width = Math.abs(start.x - e.nativeEvent.offsetX);
    const height = Math.abs(start.y - e.nativeEvent.offsetY);
    setRect({ x, y, width, height }); // selection rectangle
    setStart(null); // reset start position
  }
  const onMouseMove = (e) => {
    if (!start || !imgRef.current) return; // no selection started nor image selected
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Show image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);

    // Define selection rectangle
    const x = Math.min(start.x, e.nativeEvent.offsetX);
    const y = Math.min(start.y, e.nativeEvent.offsetY);
    const w = Math.abs(start.x - e.nativeEvent.offsetX);
    const h = Math.abs(start.y - e.nativeEvent.offsetY);

    // Style selection rectangle
    ctx.fillStyle = 'rgba(255, 255, 0, 0.3)'; // yellow
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = 'orange';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
  };

  const sendToServer = async () => {
    // post data to obtain scale
    if (!rect || !imageData) return;

    try {
      const response = await fetch('http://localhost:5050/auto-scale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageData,
          x: Math.round(rect.x/scaleRef.current),
          y: Math.round(rect.y/scaleRef.current),
          width: Math.round(rect.width/scaleRef.current),
          height: Math.round(rect.height/scaleRef.current)
        })
      });

      const json = await response.json();
      setResult(json);
      console.log('Server result:', json);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
      <div style={{padding: '20px'}}>
        <h1>Auto Scale Detector</h1>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem'  }}>
        <div style={{ marginTop: '20px' }}>
          <canvas ref={canvasRef}
                  style={{ border: '1px solid black', display: 'block' }}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}/>
          {rect && (
              <div>
                {/*
                <p>
                  Selection: X={Math.round(rect.x/scaleRef.current)}, Y={Math.round(rect.y/scaleRef.current)}, {Math.round(rect.width/scaleRef.current)}x{Math.round(rect.height/scaleRef.current)} px
                </p>
                */}
                <button onClick={sendToServer}>Get scale</button>
              </div>
          )}
        </div>
          <div>
          {result && !result.error && (
              <div>
              <h3>Processed Result</h3>
                <p>
                  Detected Text: <strong>{result.ocr}</strong><br />
                  Detected Number: {result.number}<br />
                  Pixel Length: {result.pixels} px<br />
                  Scale: <strong>{result.scale} {result.unit}/px</strong>
                </p>
                {result.image && (
                    <img src={result.image} alt="Detected scale bar" style={{ maxWidth: '100%', border: '1px solid #ccc' }} />
                )}
              </div>
          )}

          {result?.error && (
              <p style={{ color: 'red' }}> {result.error}</p>
          )}
        </div>
        </div>
      </div>
  );
}

export default App;
