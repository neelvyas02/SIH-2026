Yes. Paste this **entire block** into:

```text
ai-engine/README.md
```

I have written it so another team member can understand the project from **clone → setup → trained model → run → testing → training → troubleshooting**.

````markdown
# BorderGuard AI Engine

## Overview

The BorderGuard AI Engine is the computer-vision component of the BorderGuard project.

It is responsible for processing images/videos and detecting people and weapons using a trained YOLO-based object detection model.

The AI engine is maintained in the `ai-engine` branch.

---

# Features

- Person detection
- Weapon detection
- Video-based inference
- Custom trained YOLO model
- Detection confidence scores
- Bounding-box detection
- Support for running inference on local systems
- Model training support

---

# Repository

GitHub Repository:

https://github.com/VIVEKDHEDHI021/SIH-2026

AI Engine Branch:

```text
ai-engine
````

---

# Project Structure

```text
SIH-2026/
│
├── ai-engine/
│   │
│   ├── detect.py
│   ├── train.py
│   │
│   ├── models/
│   │   └── best.pt
│   │
│   ├── README.md
│   │
│   └── ...
│
├── backend/
├── frontend/
└── ...
```

---

# Requirements

## Hardware

Recommended:

* NVIDIA GPU for faster inference/training
* 8 GB or more VRAM recommended for GPU workloads
* 16 GB RAM recommended
* At least 10 GB free disk space for dependencies and models

The AI engine can also run on CPU, but inference and training will generally be slower.

---

# Software Requirements

* Windows 10/11 or Linux
* Git
* Python 3.x
* pip
* Virtual environment
* PyTorch
* Ultralytics YOLO
* OpenCV
* NumPy

---

# 1. Clone the Repository

Open PowerShell or Command Prompt.

Clone the `ai-engine` branch directly:

```bash
git clone -b ai-engine https://github.com/VIVEKDHEDHI021/SIH-2026.git
```

Move into the project:

```bash
cd SIH-2026
```

Verify the current branch:

```bash
git branch
```

Expected output:

```text
* ai-engine
  main
```

---

# 2. Update the Repository

Before running the project, get the latest code:

```bash
git pull
```

Make sure you are on the AI-engine branch:

```bash
git branch
```

It should show:

```text
* ai-engine
```

---

# 3. Check Python

Check the installed Python version:

```bash
python --version
```

Example:

```text
Python 3.12.x
```

Python 3.x is required.

If `python` is not recognized, install Python and make sure Python is added to PATH.

---

# 4. Create a Virtual Environment

From the root of the repository:

```bash
python -m venv .venv
```

This creates:

```text
SIH-2026/
└── .venv/
```

---

# 5. Activate the Virtual Environment

## Windows PowerShell

```powershell
.\.venv\Scripts\Activate.ps1
```

After activation, the terminal should look similar to:

```text
(.venv) PS D:\SIH-2026>
```

## Windows Command Prompt

```cmd
.venv\Scripts\activate
```

## Linux

```bash
source .venv/bin/activate
```

---

# 6. Upgrade pip

Run:

```bash
python -m pip install --upgrade pip
```

---

# 7. Install AI Dependencies

If `requirements.txt` is available inside `ai-engine`, run:

```bash
pip install -r ai-engine/requirements.txt
```

If a requirements file is not available, install the main dependencies:

```bash
pip install ultralytics opencv-python numpy
```

Ultralytics will install the required PyTorch dependencies in a standard installation.

---

# 8. Verify the Installation

Check Ultralytics:

```bash
python -c "import ultralytics; print(ultralytics.__version__)"
```

Check OpenCV:

```bash
python -c "import cv2; print(cv2.__version__)"
```

Check NumPy:

```bash
python -c "import numpy; print(numpy.__version__)"
```

Check PyTorch:

```bash
python -c "import torch; print(torch.__version__)"
```

---

# 9. Check GPU Availability

If an NVIDIA GPU is available, check whether PyTorch can use it:

```bash
python -c "import torch; print('CUDA available:', torch.cuda.is_available())"
```

If the result is:

```text
CUDA available: True
```

the AI engine can use the NVIDIA GPU through the installed PyTorch environment.

If the result is:

```text
CUDA available: False
```

the application may still run using CPU, depending on the code and installed dependencies.

---

# 10. Obtain the Trained Model

The trained model file is:

```text
best.pt
```

The trained model is not stored in the normal Git repository because model files can be very large.

Obtain the trained model separately from the project team.

Place the model at:

```text
ai-engine/models/best.pt
```

The final structure should be:

```text
SIH-2026/
│
└── ai-engine/
    ├── detect.py
    ├── train.py
    ├── models/
    │   └── best.pt
    └── README.md
```

---

# 11. Verify the Model File

Before running inference, verify that the model exists.

Windows PowerShell:

```powershell
Test-Path ai-engine\models\best.pt
```

Expected:

```text
True
```

You can also check the file:

```powershell
Get-Item ai-engine\models\best.pt
```

Make sure the file size is reasonable and that it is the trained model supplied by the project team.

---

# 12. Run the AI Engine

The main detection script is:

```text
ai-engine/detect.py
```

From the repository root:

```bash
python ai-engine/detect.py
```

If the script provides command-line options, first check them using:

```bash
python ai-engine/detect.py --help
```

Use the options implemented by the current version of `detect.py`.

---

# 13. Video Input

The AI engine can be tested using a video file supported by the detection script.

Example input:

```text
test_video.mp4
```

Place the test video in an appropriate input directory used by the project.

Then run the command expected by `detect.py`.

Example:

```bash
python ai-engine/detect.py --source test_video.mp4
```

If `--source` is not supported, run:

```bash
python ai-engine/detect.py --help
```

and use the available input option.

---

# 14. Image Input

The same detection system can be tested with an image if image inference is supported by the current implementation.

Example:

```text
test_image.jpg
```

Run the command supported by `detect.py`.

---

# 15. Expected Detection Result

When the model processes a frame or video, it should detect objects learned during training.

Typical output contains:

```text
Class
Confidence
Bounding Box
Frame Number
```

Example:

```text
person     0.95
handgun    0.91
knife      0.87
```

The exact classes depend on the dataset and the trained model.

---

# 16. Detection Confidence

The model produces a confidence value for each detection.

Example:

```text
handgun -> 0.92
knife   -> 0.87
person  -> 0.96
```

Higher values indicate that the model assigned higher confidence to that detection.

The final application should use an appropriate confidence threshold configured in the detection code.

---

# 17. Training the Model

Training is handled by:

```text
ai-engine/train.py
```

Before training:

1. Prepare the required dataset.
2. Verify the dataset structure.
3. Verify the YOLO dataset configuration.
4. Verify the training configuration in `train.py`.
5. Ensure sufficient GPU/RAM/storage resources are available.

Run:

```bash
python ai-engine/train.py
```

The exact training configuration is defined inside `train.py`.

---

# 18. Do Not Commit Training Data

Do not normally commit large datasets to this Git repository.

Avoid adding:

```text
datasets/
dataset/
training_data/
large_video_files/
large_image_collections/
```

unless the project specifically requires them.

---

# 19. Do Not Commit Large Model Files to Normal Git

Do not normally commit:

```text
*.pt
*.pth
*.onnx
*.safetensors
*.engine
```

Large trained models should be distributed separately or stored using the project's approved model-storage solution.

The main trained model for this project is:

```text
ai-engine/models/best.pt
```

---

# 20. Virtual Environment Should Not Be Committed

Do not commit:

```text
.venv/
venv/
__pycache__/
*.pyc
```

These are machine-specific files and should be recreated on each system.

---

# 21. Recommended .gitignore

The project should ignore files such as:

```gitignore
# Python
__pycache__/
*.pyc
.venv/
venv/

# Model files
*.pt
*.pth
*.onnx
*.safetensors
*.engine

# Training output
runs/
logs/
outputs/

# Dataset
datasets/
dataset/
training_data/

# Environment files
.env
```

---

# 22. Running on a New Computer - Complete Process

A new team member should follow these steps:

```text
1. Install Git
2. Install Python
3. Clone the repository
4. Switch to ai-engine branch
5. Create Python virtual environment
6. Activate virtual environment
7. Upgrade pip
8. Install dependencies
9. Obtain trained best.pt separately
10. Place best.pt inside ai-engine/models/
11. Test PyTorch
12. Test CUDA if NVIDIA GPU is available
13. Run detect.py
14. Test using sample video
```

Complete example:

```powershell
git clone -b ai-engine https://github.com/VIVEKDHEDHI021/SIH-2026.git

cd SIH-2026

git pull

python -m venv .venv

.\.venv\Scripts\Activate.ps1

python -m pip install --upgrade pip

pip install -r ai-engine/requirements.txt

python -c "import torch; print(torch.__version__)"

python -c "import torch; print('CUDA:', torch.cuda.is_available())"

Test-Path ai-engine\models\best.pt

python ai-engine\detect.py
```

---

# 23. Troubleshooting

## Python command not found

Try:

```bash
py --version
```

If Python is installed through the Windows launcher, create the environment using:

```bash
py -m venv .venv
```

---

## Virtual environment activation error

For PowerShell, try:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Then:

```powershell
.\.venv\Scripts\Activate.ps1
```

---

## ModuleNotFoundError

Example:

```text
ModuleNotFoundError: No module named 'ultralytics'
```

Activate the virtual environment and install dependencies:

```bash
pip install -r ai-engine/requirements.txt
```

or:

```bash
pip install ultralytics opencv-python numpy
```

---

## Model not found

If you see an error such as:

```text
FileNotFoundError
```

verify that:

```text
ai-engine/models/best.pt
```

exists.

On Windows:

```powershell
Test-Path ai-engine\models\best.pt
```

The result should be:

```text
True
```

---

## CUDA is False

Check:

```bash
python -c "import torch; print(torch.cuda.is_available())"
```

If CUDA is unavailable:

* Verify NVIDIA drivers.
* Verify the correct PyTorch installation.
* Verify that the GPU is supported.
* The application may still run on CPU, although it may be slower.

---

## Detection script arguments

To see the options supported by the current detection implementation:

```bash
python ai-engine/detect.py --help
```

Do not assume command-line arguments that are not implemented by the current `detect.py`.

---

# 24. Development Workflow

When making changes to the AI engine:

```text
1. Checkout ai-engine branch
2. Pull latest changes
3. Modify AI-engine code
4. Test locally
5. Check git status
6. Stage only required files
7. Commit changes
8. Push to ai-engine
```

Example:

```bash
git checkout ai-engine

git pull

git status

git add ai-engine/detect.py
git add ai-engine/train.py

git commit -m "Update weapon detection model logic"

git push
```

---

# 25. Important Git Rules

Before committing, always run:

```bash
git status
```

Do not blindly use:

```bash
git add .
```

when the project contains large model files, datasets, videos, or training outputs.

Stage only the files that are intended to be committed.

---

# 26. Current AI Engine Branch

Current branch:

```text
ai-engine
```

Main AI files:

```text
ai-engine/detect.py
ai-engine/train.py
```

Trained model:

```text
ai-engine/models/best.pt
```

The trained model is distributed separately and is not included in the normal Git push.

---

# 27. Team Workflow

The `ai-engine` branch is intended for AI-engine development.

Recommended workflow:

```text
main
 │
 ├── stable project code
 │
 └── ai-engine
       │
       ├── AI detection code
       ├── training code
       ├── inference updates
       └── AI-related improvements
```

AI-engine changes should be developed and tested on:

```text
ai-engine
```

before they are merged into the main project.

---

# 28. Quick Start

For an already configured computer:

```powershell
git clone -b ai-engine https://github.com/VIVEKDHEDHI021/SIH-2026.git

cd SIH-2026

python -m venv .venv

.\.venv\Scripts\Activate.ps1

python -m pip install --upgrade pip

pip install -r ai-engine\requirements.txt

# Place the trained model here:
# ai-engine\models\best.pt

python ai-engine\detect.py
```

---

# 29. Contact / Team

Project:

```text
BorderGuard AI
SIH 2026
```

Repository:

```text
https://github.com/VIVEKDHEDHI021/SIH-2026
```

AI branch:

```text
ai-engine
```

````

### Then save it

In VS Code:

```text
Ctrl + S
````

Then from:

```text
PS D:\BorderGuardAi\SIH-2026>
```

run:

```powershell
git add ai-engine/README.md
git commit -m "Add AI engine documentation"
git push
```

Then verify:

```powershell
git status
```

You should see:

```text
On branch ai-engine
Your branch is up to date with 'origin/ai-engine'.
```

**One important thing:** the README above deliberately doesn't claim an exact `detect.py` command-line syntax because I haven't seen the current contents of your `detect.py`. The `--help` instruction prevents your teammate from using an argument your script doesn't actually support.
