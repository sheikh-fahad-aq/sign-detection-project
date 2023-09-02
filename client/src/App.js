import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';

function HandDetectionApp() {

  let [textValue,setTextValue] = useState("")
  let [photoList,setPhotoList] = useState([])
  const [isApiCallPending, setIsApiCallPending] = useState(false);

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const getVideoSnapshot = (videoElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL();
  }

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

  useEffect(() => {
    const runHandDetection = async () => {
      // Load the HandPose model
      const net = await handpose.load();
      let count_num = 0;
      const interval =  setInterval(async () => {
        if (webcamRef.current) {
          const video = webcamRef.current.video;
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');

          // Ensure the canvas dimensions match the video dimensions
          canvas.width = video.width;
          canvas.height = video.height;

          // Detect hands in the video feed
          const predictions = await net.estimateHands(video);

          // Clear the canvas before drawing new data
          context.clearRect(0, 0, canvas.width, canvas.height);

          // Draw bounding boxes around detected hands
          if (predictions.length > 0) {
            predictions.forEach((hand) => {
              const topLeft = hand.boundingBox.topLeft;
              const bottomRight = hand.boundingBox.bottomRight;

              // Calculate bounding box coordinates
              const x = topLeft[0];
              const y = topLeft[1];
              const width = bottomRight[0] - topLeft[0] ;
              const height = bottomRight[1] - topLeft[1] ;

              context.strokeStyle = 'red';

              // Draw the bounding box
              context.strokeRect(x+50, y+150, width, height);

             
            });
            
             // Calculate the position to center the canvas
             const centerX = (video.width - canvas.width) / 2;
             const centerY = (video.height - canvas.height) / 2;
 
             // Apply the calculated position
             canvas.style.transform = `translate(${centerX}px, ${centerY}px)`;

           
          }
        }
      }, 100); // 3-second interval for both hand detection and API call

      return () => clearInterval(interval);
    };

    runHandDetection();

    

  }, []);

  useEffect( () => {

    const interval = setInterval(async () => {
      console.log("Calling API Now")
      try {
        const response = await fetch('http://localhost:8000/detection_image/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: getVideoSnapshot(webcamRef.current.video) }),
        });

        if (response.ok) {
          const data = await response.json();
          setPhotoList(prevList => [...prevList, { label: data.class_name, image: 'data:image/png;base64,'+data.image }]);
          const newText = textValue + data.class_name;
          setTextValue(newText);
        }
    } catch (error) {
      console.error("Error While Process: " + error);
    } finally {
      setIsApiCallPending(false);
    }
  }, 3000)

  return () => clearInterval(interval);
   
  }, [isApiCallPending])

  useEffect(() => {
    
    const interval = setInterval( () => {
      if (canvasRef.current){
        console.log(canvasRef.current)
        setIsApiCallPending(true);
      }
       
    }, 3000)
  
    return () => clearInterval(interval);
  }, [])


  return (
    
    <div className='min-h-screen bg-gray-800 shadow max-w-8xl max-h-8xl mx-auto px-4 sm:px-6 md:px-8'>

      <header>
        <div className="max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-white text-3xl font-bold tracking-tight text-gray-900">Real Time Sign Language Alphabet Recognition</h1>
        </div>
      </header>

      <main className='h-screen'>

        <div className="flex">

        <div className="w-1/2">
          <div className="max-w-3xl py-6 sm:px-6 lg:px-8">
            
              <Webcam
                  audio={false}
                  height={480}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  width={640}
                />
                <canvas
                  ref={canvasRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 1, // Ensure the canvas is above the video
                  }}
                />
            </div>
            {isApiCallPending ? (
              <p className="text-white text-3xl font-bold tracking-tight">Calling API in 2 Sec...</p>
            ) : (<p></p>)}
            <div className="max-w-3xl py-6 sm:px-6 lg:px-8">
                <span className='flex item-align-center text-white'>Extract Text :</span><textarea className="max-w-3xl" value={textValue} onChange={handleTextareaChange}></textarea>
            </div>
            
            <div className="flex justify-start px-5 py-2">

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
                      <img  style={{ width: '300px', height: '200px' }} src={detection.image} alt={`Image ${index + 1}`} />
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
}

export default HandDetectionApp;