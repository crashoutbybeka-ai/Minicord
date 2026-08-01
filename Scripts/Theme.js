const themeUpload = document.getElementById("themeUpload");
const page = window.location.pathname.split("/").pop();
// Load saved theme on startup

if (page === "Messenger.html") {
const savedTheme = localStorage.getItem("customTheme");

if (savedTheme) {
    const style = document.createElement("style");
    style.id = "customTheme";
    style.textContent = savedTheme;
    document.head.appendChild(style);
}
themeUpload.addEventListener("change", (event) => {
    const file = event.target.files[0];

    if (!file) return;

    // Ensure file is actually a CSS file
    const isCSS =
        file.name.toLowerCase().endsWith(".css") ||
        file.type === "text/css";

    if (!isCSS) {
        alert("Only CSS theme files are allowed.");
        themeUpload.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        const css = e.target.result;

        let style =
            document.getElementById("customTheme");

        if (!style) {
            style = document.createElement("style");
            style.id = "customTheme";
            document.head.appendChild(style);
        }

        style.textContent = css;

        localStorage.setItem(
            "customTheme",
            css
        );

        alert("Theme applied!");
    };

    reader.readAsText(file);
});
} else {
const savedTheme = localStorage.getItem("customTheme");

if (savedTheme) {
    const style = document.createElement("style");
    style.id = "customTheme";
    style.textContent = savedTheme;
    document.head.appendChild(style);
}
}