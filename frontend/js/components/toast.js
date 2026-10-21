/*----------js/components/toast.js --------*/
//单例容器，消息自动消失，点击可提前关闭

let container = null;

function ensureContainer(){
    if ( container && document.body.contains(container)) return container;

    container = document.createElement("div");
    container.className = "toast-container";
    container.setAttribute("role","status");
    container.setAttribute("aria-live","polite");
    document.body.append(container);
    return container;
}




/**
 * @param {string} message
 * @param {{ type?: "info" | "success" | "error" ,duration?: number }} [options]
 * @returns {() => void}
 */
export function toast(message, { type = "info", duration = 3000} = {}){
    const root = ensureContainer();
    const node = document.createElement("div");
    node.className = `toast toast-${type}`;
    node.textContent = message;
    root.append(node);

    requestAnimationFrame( () => { if (!removed) node.classList.add("toast-visible"); });

    let removed = false;
    const remove = () => {
        if(removed) return;
        removed = true;
        node.classList.remove("toast-visible");
        node.addEventListener("transitionend", () => node.remove(), {once: true});
        setTimeout(() => node.remove(), 300);
    };

    const timer = setTimeout(remove,duration);
    node.addEventListener("click", ()=>{
        clearTimeout(timer);
        remove();
    })

    return () => {
        clearTimeout(timer);
        remove();
    };

}