// ==============================
// Supabase Configuration
// ==============================

if (!window.supabase) {
    throw new Error(
        "Supabase JS library is not loaded."
    );
}

const db = window.supabaseClient || window.supabase.createClient(
    "https://iihprbgorfnjfyrlglfh.supabase.co",
    "sb_publishable_3XKBpQ9iB3RAj96tZMnTfA_FaqAPB77"
);

// ==============================
// Current Server
// ==============================

const currentServer =
    localStorage.getItem("current_server");

if (!currentServer) {
    alert("Please select a server.");

    window.location.href =
        "../Pages/server_selection.html";

     throw new Error("No server selected.");
}

// ==============================
// Sounds
// ==============================

const sfx = new Audio("../Assests/notification.mp3");
const send = new Audio("../Assests/send.mp3");

// ==============================
// Auth User
// ==============================

let authUser = null;

// ==============================
// User Tags
// ==============================

const userTags = {
    "Beka": "[Owner]",
    "Hunter": "[Executive Moderator]",
    "Brayden": "[Moderator]",
    "Jaxson": "[Moderator]"
};

// ==============================
// Emergency Reset Codes
// ==============================

const bitSecureKey = [
    "456423",
    "123456",
    "010101"
];

// ==============================
// Profanity Filter
// ==============================

const black_listed_words = [
    "Epstein",
    "Diddy",
    "daddy",
    "Niger",
    "Niggas",
    "Cum",
    "Fuck",
    "Nigger",
    "shit",
    "slut",
    "hoe",
    "whore"
];

// ==============================
// Message Cache
// ==============================

let loadedMessageIds = new Set();
let firstLoad = true;

// ==============================
// Helper Functions
// ==============================

function getDisplayName(name) {

    if (userTags[name]) {
        return `${userTags[name]} ${name}`;
    }

    return name;
}

function formatTime(dateString) {

    const date = new Date(dateString);

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

}

function checkFilteredWords(message) {

    return black_listed_words.some(word =>
        message.toLowerCase().includes(word.toLowerCase())
    );

}

function escapeHTML(text) {

    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;

}

// ==============================
// Get Current Auth User
// ==============================

async function loadCurrentUser() {

    const {
        data: { user },
        error
    } = await db.auth.getUser();

    if (error || !user) {

        console.error(
            "Unable to retrieve authenticated user.",
            error
        );

        window.location.href =
            "../Pages/SignIn.html";

        throw new Error(
            "User is not signed in."
        );

    }

    authUser = user;

    await ensureCurrentUserRecord();

    return user;

}

async function ensureCurrentUserRecord() {

    if (!authUser?.id) {
        return;
    }

    const {
        data: existingUser,
        error: selectError
    } = await db
        .from("users")
        .select("id")
        .eq("id", authUser.id)
        .maybeSingle();

    if (selectError && selectError.code !== "PGRST116") {
        console.warn(
            "Unable to verify user record:",
            selectError
        );
        return;
    }

    if (existingUser) {
        return;
    }

    const { error: insertError } = await db
        .from("users")
        .insert({ id: authUser.id });

    if (insertError && insertError.code !== "23505") {
        console.warn(
            "Unable to create user record for messaging:",
            insertError
        );
    }
}

// ==============================
// Developer Information
// ==============================

async function showDeveloperInfo() {

    if (!authUser) return;

    const name =
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email;

    // Only show developer info to developers

    if (
        name !== "Beka" &&
        name !== "Hunter"
    ) {
        return;
    }

    const devText =
        document.createElement("div");

    devText.style.position = "fixed";
    devText.style.bottom = "10px";
    devText.style.right = "10px";
    devText.style.fontFamily = "Comfortaa";
    devText.style.fontSize = "12px";
    devText.style.color = "gray";

    devText.innerHTML =
        `User ID: ${authUser.id}<br>
         Server ID: ${currentServer}`;

    document.body.appendChild(devText);

}

function displayMessages(records) {

    const container = document.getElementById("messages");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!records || records.length === 0) {
        container.innerHTML =
            "<div class='empty'>No messages yet.</div>";
        return;
    }

    // Replace this with YOUR Supabase Auth UUID
    const OWNER_ID =
        "b26e21b2-0053-4e76-bc4f-279d4ba1b8fb";

    for (const record of records) {

        const isMine =
            authUser &&
            record.sender_id === authUser.id;

        const isOwner =
            authUser &&
            authUser.id === OWNER_ID;

        const canDelete =
            isMine || isOwner;

        const div =
            document.createElement("div");

        div.className =
            "message " +
            (isMine ? "sent" : "received");

        // ==========================
        // Sender
        // ==========================

        const senderDiv =
            document.createElement("div");

        senderDiv.className = "sender";
        senderDiv.style.fontWeight = "bold";

        senderDiv.textContent =
            record.sender_name || "Unknown";

        // ==========================
        // Message
        // ==========================

        const messageDiv =
            document.createElement("div");

        messageDiv.className = "messageText";

        messageDiv.textContent =
            record.message ?? "";

        // ==========================
        // Timestamp
        // ==========================

        const timestampDiv =
            document.createElement("div");

        timestampDiv.className =
            "timestamp";

        timestampDiv.textContent =
            formatTime(record.created_at);

        // ==========================
        // Delete Button
        // ==========================

        if (canDelete) {

            const deleteButton =
                document.createElement("button");

            deleteButton.className =
                "deleteMessageButton";

            deleteButton.textContent =
                "Delete";

            deleteButton.addEventListener(
                "click",
                () => deleteMessage(record.id)
            );

            div.appendChild(deleteButton);
        }

        div.appendChild(senderDiv);
        div.appendChild(messageDiv);
        div.appendChild(timestampDiv);

        container.appendChild(div);
    }

    container.scrollTop =
        container.scrollHeight;
}

// ==============================
// Load Messages
// ==============================


async function fetchAndDisplayRecords() {

    try {

        // Ensure we have the authenticated user
        if (!authUser) {
            await loadCurrentUser();
            await showDeveloperInfo();
        }

        const {
            data,
            error
        } = await db
            .from("messages")
            .select(`
                id,
                message,
                sender_id,
                sender_name,
                created_at
            `)
            .eq("server_id", currentServer)
            .order("created_at", {
                ascending: true
            });

        if (error) {
            throw error;
        }

        const messages = data || [];

        // ==========================
        // Notification Detection
        // ==========================

        for (const message of messages) {

            if (!loadedMessageIds.has(message.id)) {

                if (
                    !firstLoad &&
                    message.sender_id !== authUser.id
                ) {
                    try {
                        sfx.currentTime = 0;
                        await sfx.play();
                    } catch (_) {}
                }

                loadedMessageIds.add(message.id);
            }

        }

        displayMessages(messages);

        firstLoad = false;

    }
    catch (error) {

        console.error(
            "Failed to load messages:",
            error
        );

    }

}

// ==============================
// Send Message
// ==============================

const messageForm =
    document.getElementById("messageForm");

if (messageForm) {

    messageForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        try {

            if (!authUser) {
                await loadCurrentUser();
            }

            const messageInput =
                document.getElementById("messageField");

            if (!messageInput) return;

            const message =
                messageInput.value.trim();

            if (!message) {
                return;
            }

            // ==========================
            // Commands
            // ==========================

            if (message === "/server") {

                alert(`Current Server:\n${currentServer}`);

                messageInput.value = "";

                return;

            }

            // ==========================
            // Profanity Filter
            // ==========================

            if (checkFilteredWords(message)) {

                alert("Violation of Terms of Service.");

                return;

            }

            // ==========================
            // Sender Name
            // ==========================

            const displayName =
                authUser.user_metadata?.full_name ||
                authUser.user_metadata?.name ||
                authUser.email;

            // ==========================
            // Insert Message
            // ==========================

            await ensureCurrentUserRecord();

            const { error } = await db
                .from("messages")
                .insert({

                    server_id: currentServer,

                    sender_id: authUser.id,

                    sender_name:
                        getDisplayName(displayName),

                    message: message

                });

            if (error) {

                console.error(
                    "Failed to send message:",
                    error
                );

                alert(error.message);

                return;

            }

            messageInput.value = "";

            try {
                send.currentTime = 0;
                await send.play();
            }
            catch (_) {}

            await fetchAndDisplayRecords();

        }
        catch (err) {

            console.error(err);

            alert(
                "Unable to send your message."
            );

        }

    });

}

function displayMessages(records) {

    const container = document.getElementById("messages");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!records || records.length === 0) {
        container.innerHTML =
            "<div class='empty'>No messages yet.</div>";
        return;
    }

    // Replace this with YOUR Supabase Auth UUID
    const OWNER_ID =
        "YOUR_SUPABASE_AUTH_UUID";

    for (const record of records) {

        const isMine =
            authUser &&
            record.sender_id === authUser.id;

        const isOwner =
            authUser &&
            authUser.id === OWNER_ID;

        const canDelete =
            isMine || isOwner;

        const div =
            document.createElement("div");

        div.className =
            "message " +
            (isMine ? "sent" : "received");

        // ==========================
        // Sender
        // ==========================

        const senderDiv =
            document.createElement("div");

        senderDiv.className = "sender";
        senderDiv.style.fontWeight = "bold";

        senderDiv.textContent =
            record.sender_name || "Unknown";

        // ==========================
        // Message
        // ==========================

        const messageDiv =
            document.createElement("div");

        messageDiv.className = "messageText";

        messageDiv.textContent =
            record.message ?? "";

        // ==========================
        // Timestamp
        // ==========================

        const timestampDiv =
            document.createElement("div");

        timestampDiv.className =
            "timestamp";

        timestampDiv.textContent =
            formatTime(record.created_at);

        // ==========================
        // Delete Button
        // ==========================

        if (canDelete) {

            const deleteButton =
                document.createElement("button");

            deleteButton.className =
                "deleteMessageButton";

            deleteButton.textContent =
                "Delete";

            deleteButton.addEventListener(
                "click",
                () => deleteMessage(record.id)
            );

            div.appendChild(deleteButton);
        }

        div.appendChild(senderDiv);
        div.appendChild(messageDiv);
        div.appendChild(timestampDiv);

        container.appendChild(div);
    }

    container.scrollTop =
        container.scrollHeight;
}

// ==============================
// Initialize Messenger
// ==============================

document.addEventListener("DOMContentLoaded", async () => {

    try {

        await loadCurrentUser();

        await showDeveloperInfo();

        await fetchAndDisplayRecords();

    }
    catch (err) {

        console.error(err);

        alert(
            "You must be signed in to use MiniCord."
        );

        window.location.href =
            "../Pages/SignIn.html";

    }

});

// ==============================
// Supabase Realtime
// ==============================

const messageChannel = db

    .channel(`server-${currentServer}`)

    .on(

        "postgres_changes",

        {

            event: "*",

            schema: "public",

            table: "messages",

            filter: `server_id=eq.${currentServer}`

        },

        async () => {

            await fetchAndDisplayRecords();

        }

    )

    .subscribe((status) => {

        console.log(
            "Realtime:",
            status
        );

    });