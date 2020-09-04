// video Element
const video = document.getElementById('video');

let predictedAges = [];

// Get all models
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('assets/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('assets/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('assets/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('assets/models'),
    faceapi.nets.ageGenderNet.loadFromUri('assets/models'),
]).then(startVideo);

// start video function
function startVideo() {
    navigator.getUserMedia_ = (
        navigator.getUserMedia
        || navigator.webkitGetUserMedia
        || navigator.mozGetUserMedia
        || navigator.msGetUserMedia);

    let mediaDevices = navigator.mediaDevices;

    if (mediaDevices) {
        mediaDevices.getUserMedia(
            { video: {} }
        )
            .then(stream => video.srcObject = stream)
            .catch(err => console.error(err));
    } else {
        navigator.getUserMedia_(
            { video: {} },
            stream => video.srcObject = stream,
            err => console.log(err)
        );
    }
}

// Overlays
video.addEventListener('playing', () => {
    // Create canvas on top of video
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);

    // Match canvas with video
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions()
        )
            .withFaceLandmarks()
            .withFaceExpressions()
            .withAgeAndGender();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        // clear previous canvas
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

        // draw new canvas
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

        if (resizedDetections[0]) {
            const age = resizedDetections[0].age;
            const gender = resizedDetections[0].gender;
            const interpolatedAge = interpolateAgePredictions(age);
            const bottomRight = {
                x: resizedDetections[0].detection.box.bottomRight.x - 100,
                y: resizedDetections[0].detection.box.bottomRight.y
            }

            new faceapi.draw.DrawTextField(
                [`${gender} | ${faceapi.utils.round(interpolatedAge, 0)} years`],
                bottomRight
            ).draw(canvas);
        }
    }, 100);
});

function interpolateAgePredictions(age) {
    predictedAges = [age].concat(predictedAges).slice(0, 30);
    const avgPredictedAge =
        predictedAges.reduce((total, a) => total + a) / predictedAges.length;

    return avgPredictedAge;
}