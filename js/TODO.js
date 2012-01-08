Core.register("TODO", function(oAction) {
    var win = window;
    return {
        oTodoList: null,
        oClearAll: null,
        // 1ra PARTE: Local Storage de configuración
        getPathImages: function(sSkin) {
            sSkin = sSkin || App.globals.skin;
            if (sSkin === undefined || sSkin === null) {
                sSkin = 'light';
            }
            return "skin/" + sSkin + "/images/";
        },
        setStorageAndGetStored: function() {
            // Make the implementation
        },
        isStorageSupported: function() {
            // Make the implementation
        },
        clearTodoList: function() {
            this.oTodoList.innerHTML = '';
        },
        clearAll: function() {
            // Make the implementation
        },
        setText: function(oElement, sText) {
            try {
                oElement.textContent = sText;
            } catch(erError) {
                oElement.innerText = sText;
            }
        },
        getStoredList: function() {
            // Make the implementation
        },
        removeElement: function(oElement) {
            oElement.parentNode.removeChild(oElement);
        },
        updateItem: function(oElement, sNewValue) {
            var aLayers = oElement.getElementsByTagName("div"),
                oSpan, oInput;
            if (aLayers.length) {
                return;
            }
            oSpan = aLayers[0].getElementsByTagName("span");
            oInput = aLayers[1].getElementsByTagName("input");
            oInput.value = sNewValue;
            this.setText(oSpan, sNewValue);
        },
        startEdit: function(oDivValue, oDivEdit) {
            oDivValue.style.display = 'none';
            oDivEdit.style.display = 'block';
        },
        save: function(sId, oInput, oSpan, oDivValue, oDivEdit) {
            // Make the implementation
        },
        insert: function(sValue) {
            // Make the implementation
        },
        afterRemove: function(oItem) {
            oItem.className = 'done';
            $(oItem).find("div:eq(0) img").hide();
        },
        remove: function(sId) {
            //Make the implementation
        },
        cancel: function(oInput, sValue, oDivValue, oDivEdit) {
            oInput.value = sValue;
            oDivValue.style.display = 'block';
            oDivEdit.style.display = 'none';
        },
        getNode: function(sId, sValue) {
            var self = this,
                oItem = document.createElement("li"),
                oDiv = document.createElement("div"),
                oDivValue = oDiv.cloneNode(true),
                oDivEdit = oDiv.cloneNode(true),
                oSpan = document.createElement("span"),
                oImg = document.createElement("img"),
                oImgEdit = oImg.cloneNode(true),
                oImgDone = oImg.cloneNode(true),
                oImgSave = oImg.cloneNode(true),
                oImgCancel = oImg.cloneNode(true),
                oInput = document.createElement("input"),
                sPathImages = this.getPathImages(),
                sClassesIcons = 'todo_action';

            this.setText(oSpan, sValue);
            oImgDone.src = sPathImages + 'done.png';
            oImgDone.dataset.img = 'done.png';
            oImgDone.className = sClassesIcons;
            oImgDone.title = "Done!";
            oImgEdit.src = sPathImages + 'edit.png';
            oImgEdit.dataset.img = 'edit.png';
            oImgEdit.className = sClassesIcons + ' edit_action';
            oImgEdit.title = "Edit";
            oDivValue.appendChild(oSpan);
            oDivValue.appendChild(oImgDone);
            oDivValue.appendChild(oImgEdit);

            oInput.value = sValue;
            oImgSave.src = sPathImages + 'save.png';
            oImgSave.dataset.img = 'save.png';
            oImgSave.className = sClassesIcons;
            oImgSave.title = 'Save';
            oImgCancel.src = sPathImages + 'cancel.png';
            oImgCancel.dataset.img = 'cancel.png';
            oImgCancel.className = sClassesIcons;
            oImgCancel.title = 'Cancel';
            oDivEdit.style.display = "none";
            oDivEdit.appendChild(oInput);
            oDivEdit.appendChild(oImgSave);
            oDivEdit.appendChild(oImgCancel);

            $(oImgDone).click(function() {
                self.remove(oItem, sId);
            });
            $(oImgSave).click(function(eEvent) {
                self.save(sId, oInput, oSpan, oDivValue, oDivEdit)
            });
            $(oImgCancel).click(function(eEvent) {
                self.cancel(oInput, sValue, oDivValue, oDivEdit)
            });
            $(oImgEdit).click(function(eEvent) {
                self.startEdit(oDivValue, oDivEdit);
            });

            oItem.id = sId;
            oItem.appendChild(oDivValue);
            oItem.appendChild(oDivEdit);
            return oItem;
        },
        insertNode: function(sKey, sValue, bFirstLoad) {
            var oNode = this.getNode(sKey, sValue), sAppendType = 'prepend';
            $(oNode).hide().css('opacity', 0.0);
            if (bFirstLoad) {
                sAppendType = 'append';
            }
            $(this.oTodoList)[sAppendType]($(oNode).animate({
                opacity: 1.0
            }, 50,
                function() {
                }).slideDown(800));
        },
        setBehaviourOnList: function() {
            var self = this;
            $(this.oTodoList).bind('click dblclick', function(eEvent) {
                self.__action__.notify({
                    type: eEvent.type + 'OnItem',
                    event: eEvent
                });
            });
        },
        setBehaviourOnSubmit: function(oForm) {
            var self = this;
            $(oForm).submit(function (eEvent) {
                var sValue = $("input[type=text]").val();
                eEvent.preventDefault();
                if (sValue === null || sValue === undefined || sValue === '') {
                    return false;
                }
                try {
                    self.insert(sValue);
                } catch (erError) {
                    if (erError == QUOTA_EXCEEDED_ERR) {
                        alert('Quota exceeded!');
                    }
                }
                return false;
            });
        },
        init: function(oForm) {
            var self = this;
            if (!this.isStorageSupported()) {
                alert("Your browser doesn't support LocalStorage! Please use the last version of Google Chrome!");
                return false;
            }
            this.oClearAll = document.getElementById("clearAll");
            this.oTodoList = document.getElementById('todo_list');
            this.setStorageAndGetStored();
            this.setBehaviourOnSubmit(oForm);
            this.setBehaviourOnList();
            $(this.oClearAll).bind("click", function() {
                self.clearAll();
            });
            oAction.listen(['changeSkin'], this.handleEvent, this);
        },
        changeSkin: function(skin) {
            var aImgs = $.makeArray($(this.oTodoList).find("img"));
            var nImg = 0;
            var nLenImgs = aImgs.length;
            var oImg = null;
            for (; nImg < nLenImgs; nImg++) {
                oImg = aImgs[nImg];
                oImg.src = this.getPathImages() + oImg.dataset.img;
            }
        },
        handleEvent: function(oNotify) {
            if (oNotify.type === 'changeSkin') {
                this.changeSkin(oNotify.skin);
            }
        },
        destroy: function() {
        }
    };
});