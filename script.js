const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");


let userMessage = null;

let isResponseGenerating = false;

//API CONFIGURATION
const GEMINI_API_KEY = 'AIzaSyBQXuly5hCoQe_AkD-E7ePtDuxgr8T-QUw';
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=GEMINI_API_KEY";

const loadLocalstorageData = () => {
    const savedChats = localStorage.getItem("savedChats")
    const isLightMode = (localStorage.getItem("themeColor") === "light_mode");

    document.body.classList.toggle("light_mode", isLightMode);
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

    // Restore saved chats
    chatList.innerHTML = savedChats || "";

    document.body.classList.toggle("hide-header", savedChats);
    chatList.scrollTo(0, chatList.scrollHeight); // Scroll to the bottom
}

loadLocalstorageData();

//create mesage and return it
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

const showTypingEffect = (text, textElement,incomingMessageDiv) => {
    const words = text.split(' ');
    let currentwordIdex = 0;

    const typingInterval = setInterval(() => {
        //Append each word to the text element with space
        textElement.innerHTML += (currentwordIdex === 0 ? '' : ' ') + words[currentwordIdex++];
        incomingMessageDiv.querySelector(".icon").classList.add("hide");

        //if all words are displayed
        if(currentwordIdex === words.length) {
            clearInterval(typingInterval);
            isResponseGenerating = false;
            incomingMessageDiv.querySelector(".icon").classList.add("hide");
            localStorage.setItem("savedChats", chatList.innerHTML); // Saved chats to Local storage
        }
        chatList.scrollTo(0, chatList.scrollHeight); // Scroll to the bottom
    }, 75);
}

//Fetch response from API based on user message
const generateAPIResponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector(".text");
    try {
        const response  = await fetch(API_URL, {
            method: "POST",
            headers: {"Content-Type": 'application/json'},
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{text: userMessage}]
                    }]
            })
        });

        const data = await response.json();
        if(!response.ok) throw new Error(data.error.message);


        const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*/g, '$1');
        showTypingEffect(apiResponse, textElement, incomingMessageDiv);

    } catch (error) {
        isResponseGenerating = true;
        textElement.innerText = error.message;
        textElement.classList.add("error");
    } finally {
        incomingMessageDiv.classList.remove("loading");
    }
}

// Show a loadin animation while waaiting for the API response
const showloadingAnimation =() => {
    const html = '<div class="message incoming loading"><div class="message-content"><img src="images/gemini.svg" alt="Gemini Image" class="avatar"><p class="text"></p><div class="loading-indicator"><div class="loading-bar"></div><div class="loading-bar"></div><div class="loading-bar"></div></div></div><span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span></div>';

    const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
    chatList.appendChild(incomingMessageDiv);

    chatList.scrollTo(0, chatList.scrollHeight); // Scroll to the bottom
    generateAPIResponse(incomingMessageDiv);
}


// Copy message text to the clipboard
const copyMessage = (copyIcon) => {
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;

    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = "done"; //show tick icon 
    setTimeout (() => copyIcon.innerText = "content_copy", 1000);
}

//Handle sending outgoing chat messages
const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if(!userMessage)return; //Exit if there is no message

    isResponseGenerating = true;

    const html = '<div class="message-content"><img src="images/user.jpg" alt="User Image" class="avatar"><p class="text"></p></div>';

    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    outgoingMessageDiv.querySelector(".text").innerHTML = userMessage;
    chatList.appendChild(outgoingMessageDiv);


    typingForm.reset(); //clear input field
    chatList.scrollTo(0, chatList.scrollHeight); // Scroll to the bottom
    document.body.classList.add("hide-header"); //hide header
    setTimeout(showloadingAnimation, 500); //show loading animation after a delay
}

// suggestion
suggestions.forEach(suggestions => {
    suggestions.addEventListener("click", () => {
        userMessage = suggestions.querySelector(".text").innerText;
        handleOutgoingChat()
    });
})

// toggle between light and dark Themes
toggleThemeButton.addEventListener("click", () => {
    const isLightMode = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

deleteChatButton.addEventListener("click", () => {
    if(confirm("Age you sure you want to delete all messages?")) {
        localStorage.removeItem("savedChats");
        loadLocalstorageData();
    }
})


//prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit", (e) => {
    e.preventDefault();

    handleOutgoingChat();
});