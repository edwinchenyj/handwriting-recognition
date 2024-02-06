import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';


const CanvasComponent = () => {

    console.log('TensorFlow.js version:', tf.version.tfjs);

    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const [model, setModel] = useState(null);
    const [prediction, setPrediction] = useState(null);


    // Load the model
    useEffect(() => {
        const loadModel = async () => {
            // Update this URL to point to your model files
            const modelURL = 'model/model.json'; 
            const loadedModel = await tf.loadLayersModel(modelURL);
            setModel(loadedModel);
        };
        loadModel();
    }, []);
    

    useEffect(() => {
    
        const canvas = canvasRef.current;
        canvas.width = 800 * 2; // for high resolution
        canvas.height = 600 * 2;
        canvas.style.width = `800px`;
        canvas.style.height = `600px`;

        const context = canvas.getContext("2d");
        context.scale(2, 2);
        context.lineCap = "round";
        context.fillStyle = "black";
        context.lineWidth = 50;
        contextRef.current = context;
    }, []);

    const preprocessTensor = (tensor) => {
        // Preprocess the canvas data and make prediction
        // Note: The preprocessing steps depend on the model requirements
        // Resize to 28 x 28
        const resized = tf.image.resizeBilinear(tensor, [28, 28]).toFloat();
         const grayscale = tf.image.rgbToGrayscale(resized);
        // Normalize the image
        const offset = tf.scalar(255.0);
        const normalized = grayscale.div(offset);

        // We add a dimension to get a batch shape
        const batched = normalized.expandDims(0).squeeze(3);
        console.log('batched:', batched);
        return batched;
    }

    const handlePrediction = async () => {
        if (!model) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        // Preprocess the canvas data and make prediction
        // Note: The preprocessing steps depend on the model requirements

        const tensor = tf.browser.fromPixels(context.getImageData(0, 0, canvas.width, canvas.height));

        const processedTensor = preprocessTensor(tensor); // Define this function based on your model needs
        // const prediction = await model.predict(processedTensor).data();
        const predictions = model.predict(processedTensor);
        console.log('prediction:', predictions);   
        predictions.print();    
        const digit = predictions.argMax(1).dataSync()[0];
     
        setPrediction(digit); // Update state with the predicted digit
    };

    const startDrawing = ({ nativeEvent }) => {
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const finishDrawing = () => {
        contextRef.current.closePath();
        setIsDrawing(false);
    };

    const draw = ({ nativeEvent }) => {
        if (!isDrawing) {
            return;
        }
        const { offsetX, offsetY } = nativeEvent;
        contextRef.lineCap = "round";
        contextRef.current.strokeStyle = "white";

        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();
    };

    return (
        <div>
            <canvas
                onMouseDown={startDrawing}
                onMouseUp={finishDrawing}
                onMouseOut={finishDrawing}
                onMouseMove={draw}
                ref={canvasRef}
                />
            <button onClick={handlePrediction}>Predict Digit</button>
            {prediction && <div>Predicted Digit: {prediction}</div>}
        </div>
    );
};

export default CanvasComponent;
