Plants \& Ceramics - Deployment Guide 🌿



This repository contains the complete code for the Plants \& Ceramics luxury boutique. It is separated into two parts: the frontend (React/Vite) and the backend (Node.js/Express).



Follow these steps on your local machine to initialize the folders before pushing to GitHub and deploying to your VPS.



Step 1: Initialize the Project Folder



Open your terminal and run the following commands:



mkdir plants-ceramics

cd plants-ceramics

git init





Step 2: Set Up the Frontend (React)



We will use Vite, which is the fastest and most modern way to run React applications.



npm create vite@latest frontend -- --template react

cd frontend

npm install

npm install lucide-react tailwindcss postcss autoprefixer

npx tailwindcss init -p





Action: Save the App.jsx file we worked on into frontend/src/App.jsx.



Action: Add the Tailwind directives to your frontend/src/index.css:



@tailwind base;

@tailwind components;

@tailwind utilities;





Action: Update your tailwind.config.js to scan your files:



module.exports = {

&#x20; content: \["./index.html", "./src/\*\*/\*.{js,jsx}"],

&#x20; theme: { extend: {} },

&#x20; plugins: \[],

}





Step 3: Set Up the Backend (Node.js)



Open a new terminal window, ensure you are in the root plants-ceramics directory, and run:



mkdir backend

cd backend

npm init -y

npm install express mongoose cors dotenv





Action: Save the server.js file into this backend folder.



Action: Create a file named .env in the backend folder and add your secure credentials:



PORT=5005

MONGO\_URI=your\_mongodb\_atlas\_connection\_string\_here

ADMIN\_PASSWORD=Umarali667@





Step 4: Add .gitignore and Push to GitHub



Create a file named .gitignore in the root of your plants-ceramics folder so you don't accidentally upload heavy files or secret passwords to GitHub:



\# .gitignore

node\_modules/

.env

dist/

build/





Finally, commit your code and push it to your private GitHub repository:



git add .

git commit -m "Initial commit for Plants \& Ceramics"

git branch -M main

git remote add origin \[https://github.com/YourUsername/your-repo-name.git](https://github.com/YourUsername/your-repo-name.git)

git push -u origin main



