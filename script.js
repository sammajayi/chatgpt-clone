// document.addEventListener("DOMContentLoaded", () => {
//     const textArea = document.querySelector(".chat-container");
//     console.log(textArea);
//     const userInput = document.document.querySelector("#chat-input");
//     const sendBtn = document.querySelector("#send-btn");
//     const deleteBtn = document.getElementById("delete-btn");

//     // Auto-expand input field
//     userInput.addEventListener("input", () => {
//         userInput.style.height = "auto";
//         userInput.style.height = userInput.scrollHeight + "px";
//     });

//     // Send message
//     sendBtn.addEventListener("click", () => {
//         const userText = userInput.value.trim();
//         if (userText) {
//             addText("You", userText);
//             fetchResponse(userText);
//             userInput.value = "";
//         }
//     });

//     function addText(sender, text) {
//         const textDiv = document.createElement("div");
//         textDiv.innerHTML = `
//             <p>${sender}: ${text}</p>
//             <button class="copy-btn">📋</button>
//         `;
//         textArea.appendChild(textDiv);
//         textArea.scrollTop = textArea.scrollHeight;

//         // Copy button functionality
//         textDiv.querySelector(".copy-btn").addEventListener("click", () => {
//             navigator.clipboard.writeText(text);
//             alert("Copied!");
//         });

//         saveChatHistory(); // Save history when new message is added
//     }

//     async function fetchResponse(text) {
//         try {
//             const response = await fetch("https://api.openai.com/v1/completions", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ prompt: text })
//             });
//             if (!response.ok) throw new Error("Failed to fetch response");

//             const data = await response.json();
//             addText("AI", data.response);
//         } catch (error) {
//             addText("AI", "Error fetching response. Please try again.");
//             console.error(error);
//         }
//     }

//     function saveChatHistory() {
//         localStorage.setItem("chatHistory", textArea.innerHTML);
//     }

//     function loadChatHistory() {
//         textArea.innerHTML = localStorage.getItem("chatHistory") || "";
//     }

//     window.addEventListener("load", loadChatHistory);

//     deleteBtn.addEventListener("click", () => {
//         textArea.innerHTML = "";
//         localStorage.removeItem("chatHistory");
//     });

//     textArea.addEventListener("click", (event) => {
//         if (event.target.classList.contains("copy-btn")) {
//             const textToCopy = event.target.parentElement.querySelector("p").textContent;
//             navigator.clipboard.writeText(textToCopy);
//             alert("Copied!");
//         }
//     });
// });



const chatInput = document.querySelector("#chat-input");
const sendBtn = document.querySelector("#send-btn");
const chatContainer = document.querySelector(".chat-container");
const deleteBtn = document.getElementById("delete-btn");
let isRequestInProgress = false;


const API_KEY = "AIzaSyBm50WnOuhCVHSdbNlMvskIiU2ad8-v5kI"; // Replace with your Gemini API key
let lastRequestTime = 0;
const REQUEST_COOLDOWN = 10000; // 10 seconds delay

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const showTypingAnimation = () => {
    const typingDiv = document.createElement("div");
    typingDiv.classList.add("chat", "incoming", "typing-animation-container");
    typingDiv.innerHTML = `
        <div class="chat-content">
            <div class="chat-details">
                <img src="./assets/Images/icons8-chatgpt-48.png" alt="chatbot-img">
                <div class="typing-animation">
                    <div class="typing-dot" style="--delay: 0.2s"></div>
                    <div class="typing-dot" style="--delay: 0.3s"></div>
                    <div class="typing-dot" style="--delay: 0.4s"></div>
                </div>
            </div>
            <span class="material-symbols-rounded"><i class="fa-regular fa-copy"></i></span>
        </div>`;

    chatContainer.appendChild(typingDiv);
    return typingDiv; // Return the element so we can remove it later
};

const handleOutGoingChat = async () => {
    const now = Date.now();
    if (now - lastRequestTime < REQUEST_COOLDOWN) {
        console.log("Slow down! Please wait before sending another request.");
        return;
    }
    lastRequestTime = now;

    if (isRequestInProgress) return;
    isRequestInProgress = true;

    const userText = chatInput.value.trim();
    if (!userText) {
        isRequestInProgress = false;
        return;
    }

    displayMessage(userText, "outgoing");
    // Clear input field
    chatInput.value = ""; 

    // Show typing animation and store reference to remove later
    const typingAnimation = showTypingAnimation();

    // Fetch AI response
    const aiMessage = await getChatResponse(userText);

    // Remove typing animation
    typingAnimation.remove();

    // Display AI response if available
    if (aiMessage) displayMessage(aiMessage, "incoming");

    isRequestInProgress = false;
};

const getChatResponse = async (userMessage) => {
    await delay(1000); // Wait 3 seconds to avoid rapid requests

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;
    
    const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: userMessage }] }],
            safetySettings: [],
        })
    };

    try {
        const response = await fetch(API_URL, requestOptions);
        if (!response.ok) {
            console.log(`Error: ${response.statusText}`);
            return null;
        }
        const data = await response.json();
        console.log("API Response:", data);

        if (data.candidates && data.candidates.length > 0) {
            return data.candidates[0].content.parts[0].text || "No response from AI.";
        } else {
            console.log("Error: No valid response from AI.");
            return "I couldn't generate a response.";
        }
    } catch (error) {
        console.log("Fetch error:", error);
        return "An error occurred while fetching the response.";
    }
};

const createElement = (html, className) => {
    const chatDiv = document.createElement("div");
    chatDiv.classList.add("chat", className);
    chatDiv.innerHTML = html;
    return chatDiv;
};

const displayMessage = (text, className) => {
    const html = `<div class="chat-content">
                    <div class="chat-details">
                        <img src="assets/Images/${className === 'outgoing' ? 'user.jpg' : 'icons8-chatgpt-48.png'}" alt="${className}-img">
                        <p>${text}</p>
                    </div>
                </div>`;
    chatContainer.appendChild(createElement(html, className));
};

// Function to clear chat history
const clearChatHistory = () => {
    document.querySelectorAll(".chat").forEach(chat => {
        // Check if the chat is dynamically added
        if (!chat.innerHTML.includes("AIVerse") && !chat.innerHTML.includes("Introducing Your AI-Powered Chat Assistant!")) {
            chat.remove();
        }
    });

    // Clear chat history from local storage if stored
    localStorage.removeItem("chatHistory");
};

// Event Listeners
sendBtn.addEventListener("click", handleOutGoingChat);
deleteBtn.addEventListener("click", clearChatHistory);

sendBtn.addEventListener("click", handleOutGoingChat);
