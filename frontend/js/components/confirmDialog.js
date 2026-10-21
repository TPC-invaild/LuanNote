/*-----------js/components/confirmDialog.js---------*/
//通用确认弹窗，返回Promise<boolean>
//默认焦点在取消上，防止误触




function el(tag,className,text){
    const node = document.createElement(tag);
    if(className) node.className = className;
    if(text !== undefined) node.textContent = text;

    return node;
}

/**
 * @param {object} options
 * @param {string} options.title
 * @param {string} options.message
 * @param {string} [options.confirmText]
 * @param {string} [options.cancelText]
 * @param {boolean} [options.danger]
 * @returns {Promise<boolean>} 确认为true，取消或关闭为false
 */
export function confirmDialog({
    title = "真的要遗忘它吗?",
    message = "",
    confirmText = "遗忘",
    cancelText = "留下",
    danger = false
} = {}){
    return new Promise((resolve) => {
        let settled = false;
        let result = false;
        const triggerElement = document.activeElement;
        const dialog = el("dialog","confirm-dialog");
        dialog.setAttribute("aria-label", title);
        const body = el("div","confirm-body");

        const head = el("h2","confirm-title",title);
        const text = el("p","confirm-message",message);

        const action = el("div","confirm-actions");
        const cancelBtn = el("button","btn-secondary",cancelText);
        cancelBtn.type = "button";
        const confirmBtn = el(
            "button",
            danger ? "btn-danger":"btn-primary",
            confirmText
        );
        confirmBtn.type = "button";
        action.append(cancelBtn,confirmBtn);

        body.append(head,text,action);
        dialog.append(body);
        document.body.append(dialog);

        function close(value){
            if (settled) return;
            settled = true;
            result = value;
            dialog.close();
        }

        confirmBtn.addEventListener("click",() => close(true));
        cancelBtn.addEventListener("click",() => close(false));

        //Esc 取消
        dialog.addEventListener("cancel", (event) =>{
            event.preventDefault();
            close(false);
        } );

        //点击窗口外 取消
        dialog.addEventListener("click", (event) => {
            if(event.target !== dialog) return;
            const rect = dialog.getBoundingClientRect();
            const inside =
                event.clientX >= rect.left &&
                event.clientX <= rect.right &&
                event.clientY >= rect.top &&
                event.clientY <= rect.bottom;
            if(!inside) close(false);
        })

        dialog.addEventListener("close", () => {
            settled = true;
            dialog.remove();
            triggerElement?.focus?.();
            resolve(result);
        });

        dialog.showModal();
        cancelBtn.focus();
    });
}
