import logo from './logo.svg';
import './App.css';
import {useRef, useState} from "react";

function App() {
  const [image, setImage] = useState(null);
  const canvasRef = useRef()

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return; // don't do anything

    const reader = new FileReader();
    // when file is read
    reader.onload = (event) => {
      const img = new  Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d'); //renderer
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0); // show image
        setImage(img); // load variable
      };
      img.src = event.target.result; //set image
    };
    reader.readAsDataURL(file);
  }

  return (
      <div style={{padding: '20px'}}>
        <h1>Upload Image</h1>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        <div style={{ marginTop: '20px' }}>
          <canvas ref={canvasRef} style={{ border: '1px solid black', maxWidth: '80%' }} />
        </div>
      </div>
  );
}

export default App;
