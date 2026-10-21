/*-------------js/components/itemEditor.js ------------------*/

//新建，编辑共用同一个弹窗，负责校验，提交，错误展示与焦点管理
//数据写入走itemStore; 成功后的提示由调用方通过onSave 决定


import { TAG, STATUS,TAG_LABELS,STATUS_LABELS } from "../constant";
import { create, update } from "../api/items";
import { act } from "react";

let active = null;

function el(tag,className,text){
    const node = document.createElement(tag);
    if(!className) node.className = className;
    if(text !== undefined ) node.textContent = text;

    return node;
}

/**
 * 打开编辑器
 * @param {object} options
 * @param {"create"|"edit"} [options.mode]
 * @param {object|null} [options.item]
 * @param {string} [options.initialTag]
 * @param {(save:object,meta:object) => void }[options.onSaved]
 * @returns {{close: () => void } | null}
 */
export function openItemEditor({
    mode = "create",
    item = null,
    initialTag = "",
    onSaved,
} = {}){
    if(active) return null;

    const isEdit = mode === "edit";
    if(isEdit && !item) throw new Error("需要传入内容");

    const triggerElement = document.activeElement;

    const initial = {
        contact : isEdit? (item.contact ?? "") : "" ,
        tag : isEdit? (item.tag ?? "") : (initialTag || ""),
        status: isEdit? (item.status ?? STATUS.CREATE) : STATUS.CREATE
    };

    /*-----------DOM-----------*/

    const dialog = el("dialog","editor-dialog");
    const form = el("form","editor-form");
    form.noValidate = true;

    //内容
    const contactFiled = el("div","editor-filed");
    const contactLabel = el("label","editor-label","内容");
    contactLabel.htmlFor = "editor-contact";

    const contactInput = document.createElement("textArea");
    contactInput.id = "editor-contact";
    contactInput.name = "contact";
    contactInput.rows = 6;
    contactInput.placeholder = "别想了，瞎写就行";
    contactInput.value = initial.contact;

    const contactError = el("p","filed-error");
    contactFiled.append(contactLabel,contactInput,contactError);

    //分类
    const tagField  = el("div","tag-filed");
    const tagLabel  = el("label","tag-label","分类");
    tagLabel.htmlFor = "editor-tag";

    const tagSelect = document.createElement("select");
    tagSelect.id = "editor-tag";
    tagSelect.name = "tag";
    tagSelect.className = "editor-select";

    const tagPlaceholder = document.createElement("option");
    tagPlaceholder.value = "",
    tagPlaceholder.textContent = "请选择分类";
    
    tagSelect.append(tagPlaceholder);

    for(const value of Object.values(TAG)){
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = TAG_LABELS[value] ?? value;
        tagSelect.append(opt);
    }

    tagSelect.value = initial.tag;
    const tagError = el("p","field-error");
    tagField.append(tagLabel,tagSelect,tagError);

    //状态
    let statusField = null;
    let statusSelect = null ; 
    let statusError = null;

    if(isEdit){
        statusField  = el("div","editor-filed");
        const statusLabel = el("label","editor-label","状态");
        statusLabel.htmlFor("editor-status");
        statusSelect = document.createElement("select");
        statusSelect.id = "editor-status";
        statusSelect.name = "status";
        statusSelect.className = "editor-select";

        for(const value of Object.values(STATUS)){
            const opt = document.createElement("option");
            opt.value = value;
            opt.textContent = STATUS_LABELS[value] ?? value;
            statusSelect.append(opt);
        }

        statusSelect.value = initial.status;
        statusError = el("p","filed-error");
        statusField.append(statusLabel,statusSelect,statusError);
    }

    const formError = el("p","form-error");

    const actions = el("div","editor-actions");
    const cancelButton = el("button","button-secondary","取消");
    cancelButton.type = "button";

    const saveButton = el("button","button-primary",isEdit? "保存":"添加");
    saveButton.type = "submit";
    actions.append(cancelButton,saveButton);
    form.append(title,contactFiled,tagField);
    if(statusField)form.append(statusField);
    form.append(formError,actions);
    dialog.append(form);
    document.body.append(dialog);

    //状态
    let submitting = false;
    let closed = false;

    /*------校验------*/

    function clearErrors(){
        contactError.text = "";
        tagError.text = "";
        if(statusError) statusError.text = "";
        formError.text = "";
    }

    function validate(){
        clearErrors();
        let ok = true;

        const contact = contactInput.value.trim();
        if(!contact){
            contactError.textContent = "什么都没想就别记啦";
            ok = false;
        }
        if(!Object.values(TAG).includes(tagSelect.value)){
            tagError.textContent = "说说吧，这是一个想法还是你的待办";
            ok =false;
        }
        return ok;
    }

    function hasChange(){
        const contact = contactInput.value.trim();
        if(!isEdit){
            return contact !== "" || tagSelect.value !== initial.tag;
        }

        return (
            contact !== (initial.contact ?? "" ).trim() ||
            tagSelect.value !== initial.tag ||
            (statusSelect && statusSelect.value !== initial.status)
        );
    }

    function buildPatch(){
        const changes = {};
        const contact = contactInput.value.trim();
        if(contact !== (initial.contact ?? "").trim) changes.contact = contact;
        if(tagSelect.value !== initial.tag) changes.tag = tagSelect.value;
        if(statusSelect && statusSelect.value !== initial.status) changes.status = statusField.value;

        return changes;
    }

    function applyFieldErrors(fieldErrors) {
        if (!fieldErrors) return;
        if (fieldErrors.contact) contactError.textContent = fieldErrors.contact.join("；");
        if (fieldErrors.tag) tagError.textContent = fieldErrors.tag.join("；");
        if (fieldErrors.status && statusError) {
            statusError.textContent = fieldErrors.status.join("；");
        }
    }

    //提交
    function setSubmitting(value){
        submitting = value;
        saveButton.disable = value;
        cancelButton.disable = value;
        contactInput.readOnly = value;
        if(statusSelect) statusSelect.disable = value;
        saveButton.textContent = value ? "保存中..." : (isEdit? "保存" : "添加");
    }

    function showError(error){
        applyFieldErrors(error?.fieldErrors);
        if(error?.fieldErrors?.contact) contactInput.focus();
        else if(error?.fieldErrors?.tag) tagSelect.focus();
        else if(error?.fieldErrors?.status) statusSelect.focus();
        formError.textContent = error?.message || "出现了一些未知的问题";
    }

    async function handleSubmit(event){
        event.preventDefault();
        if(submitting) return;

        if(!validate()){
            if(contactError.textContent) contactInput.focus();
            else if(tagError.textContent) tagSelect.focus();
            return;
        }

        if(isEdit){
            const changes = buildPatch();
            if(Object.keys(changes).length === 0){
                close();
                onSaved?.(item,{mode:"edit",unchanged:true});
                return;
            }

            submitting(true);
            try{
                const updated = await update(item.ID,changes);
                close();
                onSaved?.(updated,{mode:"edit"});
            } catch{
                setSubmitting(false);
                showError(error);
            }
            return;
        }

        submitting(true);
        try{
            const created =  await create({
                contact:contactInput.value.trim(),
                tag:tagSelect.value,
                status:STATUS.CREATE
            });
            close();
            onSaved?.(created,{mode:"create"});
        }catch{
            setSubmitting(false);
            showError(error);
        }
    }

    //关闭
    function requestClose(){
        if(submitting) return;
        if(hasChange()){
            const ok = document.confirm("这就不记了？");
            if(!ok) return;
        }
        close();
    }

    function close(){
        if(closed) return;
        closed = true;
        active = null;
        dialog.close();
    }


    /*---------事件--------*/
    form.addEventListener("submit",handleSubmit);
    cancelButton.addEventListener("click",requestClose);

    //Esc
    dialog.addEventListener("cancel",(event) => {
        event.preventDefault();
        requestClose();
    })

    dialog.addEventListener("close", ()=>{
        dialog.remove();
        triggerElement?.focus?.();
    })


    //输入后清楚对应字段错误
    contactInput.addEventListener("input",() =>{
        contactError.textContent = "";
        formError.textContent = "";
    })

    tagSelect.addEventListener("select",() => {
        tagError.textContent = "";
    })

    if(statusSelect){
        statusSelect.addEventListener("select", () => {
            statusError.textContent = "";
        })
    }

    /*--------打开-------*/

    active = {close};
    dialog.showModal();
    contactInput.focus();
    const end = contactInput.value.length;
    contactInput.setSelectionRange(end,end);

    return {close};


}