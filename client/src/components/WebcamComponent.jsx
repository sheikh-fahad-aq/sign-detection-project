import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const WebcamComponent = () => {
  let [textValue,setTextValue] = useState("")
  let [photoList,setPhotoList] = useState([])
  let videoRef = useRef(null)
  let canvasRef = useRef(null);

  // get access to user webcamera

  const getUserCamera = () => {
    navigator.mediaDevices.getUserMedia({
      video: true
    })
    .then((stream) => {
      // attach the stream to the video tag

      let video = videoRef.current

      video.srcObject = stream

      video.play()

    }) 
  
  }

  const getVideoSnapshot = (videoElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL();
  }

  const GetDetections = async () => {
    const video = videoRef.current;
  
    // Create an image element
    const image = new Image();
    image.src = getVideoSnapshot(video);
  

    try {
      const response = await fetch('http://localhost:8000/detection_image/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: image.src}), // Pass the base64-encoded image data
      });
  
      if (response.ok) {
        const data = await response.json();
        setPhotoList(prevList => [...prevList, { label: data.class_name, image: image }]);
        const newText = textValue + data.class_name;
        setTextValue(newText);
      } else {
        console.log('Error processing image');
      }
    } catch (error) {
      console.log('Error processing image:', error);
    }
  
    // Append the image to the photoList array
  };

  const handleTextareaChange = (event) => {
    setTextValue(event.target.value);
  };

  const saveFile = () => {
    const blob = new Blob([textValue], { type: 'text/plain' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'extracted_text.txt';
    link.click();

    URL.revokeObjectURL(url);

    setPhotoList([]);
    setTextValue("")
  };

  const ClearAll = () => {
    setPhotoList([]);
    setTextValue("")
  }

  useEffect(()=>{
    getUserCamera()
  },[videoRef])





  return (
    
    <div className='h-screen bg-gray-800 shadow max-w-8xl max-h-8xl mx-auto px-4 sm:px-6 md:px-8'>

      <header>
        <div className="max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-white text-3xl font-bold tracking-tight text-gray-900">Real Time Sign Language Alphabet Recognition</h1>
        </div>
      </header>

      <main className=''>

      <div className="flex">

        <div className="w-1/2">
          <div className="max-w-3xl py-6 sm:px-6 lg:px-8">
              <video className='container' ref={videoRef}></video>
            </div>

            <div className="max-w-3xl py-6 sm:px-6 lg:px-8">
                <span className='flex item-align-center text-white'>Extract Text :</span><textarea className="max-w-3xl" value={textValue} onChange={handleTextareaChange}></textarea>
            </div>
            
            <div className="flex justify-start px-5 py-2">

              <button onClick={GetDetections} className="bg-sky-500 hover:bg-sky-700 px-5 mx-1 py-2 text-sm leading-5 rounded-full font-semibold text-white">
                Detect Alphabet Sign
              </button>

              <button onClick={saveFile} className="bg-sky-500 hover:bg-sky-700 px-5 mx-1 py-2 text-sm leading-5 rounded-full font-semibold text-white">
                Save Text File
              </button>

              <button onClick={ClearAll}  className="bg-red-500 hover:bg-sky-700 px-5 py-2 text-sm leading-5 mx-1 rounded-full font-semibold text-white">
                Clear All
              </button>
            </div>
        </div>

        <div className="w-2/4  overflow-y-auto border border-solid border-gray-400 p-4">
          <div className="h-2/4">
            <div className="grid grid-cols-4 gap-4">
              {photoList.map((detection, index) => (
                    <div key={index}>
                      <p className='flex-justify-center text-white'>Detection : {detection.label} </p>
                      <img src={detection.image.src} alt={`Image ${index + 1}`} />
                    </div>
                  ))}

              {photoList.length == 0 ? <div><p className='flex-justify-center text-white'>No Detections Founda</p></div> : <></>}
            </div>
          </div>
        </div>

      </div>

      </main>
    </div>

  );
};

export default WebcamComponent;