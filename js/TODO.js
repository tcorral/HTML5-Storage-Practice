Core.register("TODO", function(oAction){
	var win = window;
	return {
		oTodoList: null,
		oClearAll: null,
		getPathImages: function(sSkin)
		{
			if(sSkin === undefined)
			{
				sSkin = 'default';
			}
			return "skin/" + sSkin + "/images/";
		},
		addStorageEvent: function(fpCallback)
		{
			var sStorage = 'storage';
			if(window.addEventListener)
			{
				addEventListener(sStorage, fpCallback, false);
			}else if(window.attachEvent)
			{
				document.attachEvent('on' + sStorage, fpCallback);
			}
		},
		isLocalStorageSupported: function()
		{
			return win.localStorage !== undefined && win.localStorage !== null;
		},
		clearTodoList: function()
		{
			this.oTodoList.innerHTML = '';
		},
		clearAll: function()
		{
			localStorage.clear();
			this.clearTodoList();
			return false;
		},
		setText: function(oElement, sText)
		{
			try
			{
				oElement.textContent = sText;
			}catch(erError)
			{
				oElement.innerText = sText;
			}
		},
		getLocalStorageKeysSorted: function()
		{
			var aAux = [], sKey;
			for (sKey in localStorage)
			{
				if (localStorage.hasOwnProperty(sKey)) {
					aAux.push(sKey);
				}
			}
			return aAux.sort();
		},
		getStoredList: function()
		{
			var nItem,
				sKey,
				nStoredItems = localStorage.length,
				aKeys = this.getLocalStorageKeysSorted();
			if(nStoredItems)
			{
				for(nItem = 0; nItem < nStoredItems; nItem++)
				{
					//sKey = localStorage.key(nItem);
					sKey = aKeys[nItem];
					this.insertNode(sKey, localStorage.getItem(sKey), true);
				}
			}
		},
		removeElement: function(oElement)
		{
			oElement.parentNode.removeChild(oElement);
		},
		updateItem: function(oElement, sNewValue)
		{
			var aLayers = oElement.getElementsByTagName("div"),
				oSpan, oInput;
			if(aLayers.length)
			{
				return;
			}
			oSpan = aLayers[0].getElementsByTagName("span");
			oInput = aLayers[1].getElementsByTagName("input");
			oInput.value = sNewValue;
			this.setText(oSpan, sNewValue);
		},
		fpStorageCallback: function(eEvent)
		{
			var sKey = eEvent.key,
				sNewValue = eEvent.newValue,
				sOldValue = eEvent.oldValue,
				oElement = document.getElementById(sKey);
			if(!localStorage.length)
			{
				this.clearTodoList();
			}else if(sKey !== null && sNewValue !== null)
			{
				if(sOldValue === null)
				{
					this.insertNode(sKey, sNewValue);
				}else
				{
					this.updateItem(oElement, sNewValue);
				}
			}else
			{
				this.removeElement(oElement);
			}
		},
		startEdit: function(oDivValue, oDivEdit)
		{
			oDivValue.style.display = 'none';
			oDivEdit.style.display = 'block';
		},
		save: function(sId, oInput, oSpan, oDivValue, oDivEdit)
		{
			var sValue = oInput.value;
			try {
				localStorage.setItem(sId, sValue);
				this.setText(oSpan, sValue);
				oDivValue.style.display = 'block';
				oDivEdit.style.display = 'none';
			} catch (e) {
				if (e == QUOTA_EXCEEDED_ERR) {
					alert('Quota exceeded!');
				}
			}
		},
		cancel: function(oInput, sValue, oDivValue, oDivEdit)
		{
			oInput.value = sValue;
			oDivValue.style.display = 'block';
			oDivEdit.style.display = 'none';
		},
		getNode: function(sId, sValue)
		{
			var self = this,
				oItem = document.createElement("li"),
				oDiv = document.createElement("div"),
				oDivValue = oDiv.cloneNode(true),
				oDivEdit = oDiv.cloneNode(true),
				oSpan = document.createElement("span"),
				oImg = document.createElement("img"),
				oImgDone = oImg.cloneNode(true),
				oImgSave = oImg.cloneNode(true),
				oImgCancel = oImg.cloneNode(true),
				oInput = document.createElement("input"),
				sPathImages = this.getPathImages(),
				sClassesIcons = 'todo_action square25px';

			this.setText(oSpan, sValue);
			oImgDone.src = sPathImages + 'done.png';
			oImgDone.className = sClassesIcons;
			oImgDone.title = "Done!";
			oDivValue.appendChild(oSpan);
			oDivValue.appendChild(oImgDone);

			oInput.value = sValue;
			oImgSave.src = sPathImages + 'save.png';
			oImgSave.className = sClassesIcons;
			oImgSave.title = 'Save';
			oImgCancel.src = sPathImages + 'cancel.png';
			oImgCancel.className = sClassesIcons;
			oImgCancel.title = 'Cancel';
			oDivEdit.style.display = "none";
			oDivEdit.appendChild(oInput);
			oDivEdit.appendChild(oImgSave);
			oDivEdit.appendChild(oImgCancel);


			$(oImgDone).click(function()
			{
				$(oItem).animate({
					opacity: 0.25,
					left: '+=50',
					height: 'toggle'
				}, 1000, function () { $(oItem).remove(); localStorage.removeItem(sId); });
			});
			$(oImgSave).click(function(eEvent)
			{
				self.save(sId, oInput, oSpan, oDivValue, oDivEdit)
			});
			$(oImgCancel).click(function(eEvent)
			{
				self.cancel(oInput, sValue, oDivValue, oDivEdit)
			});
			$(oDivValue).dblclick(function(eEvent)
			{
				self.startEdit(oDivValue, oDivEdit);
			});

			oItem.id = sId;
			oItem.appendChild(oDivValue);
			oItem.appendChild(oDivEdit);
			return oItem;
		},
		insertNode: function(sKey, sValue, bFirstLoad)
		{
			var oNode = this.getNode(sKey, sValue), sAppendType = 'prepend';
			$(oNode).hide().css('opacity', 0.0);
			if(bFirstLoad)
			{
				sAppendType = 'append';
			}
			$(this.oTodoList)[sAppendType]($(oNode).animate({
				opacity: 1.0
			}, 600, function(){}).slideDown(800));
		},
		setBehaviourOnList: function()
		{
			var self = this;
			$(this.oTodoList).bind('click dblclick', function(eEvent)
			{
				self.__action__.notify({
					type: eEvent.type + 'OnItem',
					event: eEvent
				});
			});
		},
		setBehaviourOnSubmit: function(oForm)
		{
			var self = this;
			$(oForm).submit(function (eEvent) {
				var sValue = $("input[type=text]").val();
				eEvent.preventDefault();
				if (sValue === null || sValue === undefined || sValue === '') {
					return false;
				}
				try {
					var sIdentifier = new Date().getTime();
					localStorage.setItem(sIdentifier, sValue);
					self.insertNode(sIdentifier, sValue);
				} catch (erError) {
					if (erError == QUOTA_EXCEEDED_ERR) {
						alert('Quota exceeded!');
					}
				}
				return false;
			});
		},
		init: function(oForm)
		{
			var self = this;
			if(!this.isLocalStorageSupported())
			{
				alert("Your browser doesn't support LocalStorage! Please use the last version of Google Chrome!");
				return false;
			}
			this.oClearAll = document.getElementById("clearAll");
			this.oTodoList = document.getElementById('todoList');
			this.getStoredList();
			this.addStorageEvent(this.fpStorageCallback);
			this.setBehaviourOnSubmit(oForm);
			this.setBehaviourOnList();
			$(this.oClearAll).bind("click", function()
			{
				self.clearAll();
			});
		},
		handleEvent: function(){},
		destroy: function()
		{
		}
	};
});