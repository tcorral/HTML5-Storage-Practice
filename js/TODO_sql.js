Core.register("TODO", function(oAction){
	var win = window;
	return {
		oTodoList: null,
		oClearAll: null,
		oDB: null,
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
		isWebSQLSupported: function()
		{
			return win.openDatabase!== undefined && win.openDatabase !== null;
		},
		clearTodoList: function()
		{
			this.oTodoList.innerHTML = '';
		},
		clearAll: function()
		{
			var self = this;
			this.oDB.transaction(function(oTx)
			{
				oTx.executeSql('DROP TABLE IF EXISTS todo');
			}, function error(){
				console.log.call(console, arguments);
			}, function success()
			{
				self.getStoredList();
			});
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
		setDataBase: function()
		{
			var self = this;
			this.oDB = window.openDatabase(
				'TodoDB',                       // dbName
				'1.0',                          // version
				'TODO application database',    // description
				2 * 1024 * 1024,                 // estimatedSize in bytes
				function (db){}                 // optional creationCallback
			);
			this.oDB.transaction(function(oTx)
			{
				oTx.executeSql('CREATE TABLE IF NOT EXISTS todo(id INTEGER PRIMARY KEY ASC, task TEXT)');
			}, function error(){
				console.log.call(console, arguments);
			}, function success()
			{
				console.log('Leyendo stored')
				self.getStoredList();
			});
		},
		getStoredList: function()
		{
			var self = this;
			this.oDB.readTransaction(function(oTx)
			{
				oTx.executeSql('SELECT * from todo', [], function render(oTrans, aResults)
				{
					var nStoredItems = aResults.rows.length,
						nItem,
						oItem;
					for(nItem = 0; nItem < nStoredItems; nItem++)
					{
						oItem = aResults.rows.item(nItem);
						self.insertNode(oItem.id, oItem.task, true);
					}
				}, function error()
				{

				});
			});
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
		startEdit: function(oDivValue, oDivEdit)
		{
			oDivValue.style.display = 'none';
			oDivEdit.style.display = 'block';
		},
		save: function(sId, oInput, oSpan, oDivValue, oDivEdit)
		{
			var self = this,
				sValue = oInput.value;
			try {
				this.oDB.readTransaction(function(oTr, aResults)
				{
					oTr.executeSql('SELECT * FROM todo where id = ?', [sId], function ok(oTra, aResults)
					{
						var sSQL = 'INSERT INTO todo(task) VALUES (?)';
						if(aResults.rows.length > 0)
						{
							sSQL = 'UPDATE todo SET task = ? WHERE id = ?';
						}
						self.oDB.transaction(function(oTx)
						{
							oTx.executeSql(sSQL, [sValue, sId], function render(oTrans, aResults)
							{
								self.removeElement(document.getElementById(sId));
								self.insertNode(sId, sValue);
							}, function error(){
								debugger;
							});
						}, function error()
						{
							debugger;
							alert("Error on saving!");
						}, function success()
						{
							self.setText(oSpan, sValue);
							oDivValue.style.display = 'block';
							oDivEdit.style.display = 'none';
						});
					}, function ko()
					{

					});
				}, function error(){}, function success()
				{

				});
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
					},
					1000,
					function ()
					{
						self.oDB.transaction(function(oTx)
						{
							oTx.executeSql('DELETE FROM todo WHERE id = ?', [sId]);
						}, function error(){
							console.log.call(console, arguments);
						}, function success()
						{
							console.log('Borrando stored')
							$(oItem).remove();
						});
					});
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
			}, 50, function(){}).slideDown(800));
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
					self.oDB.transaction(function(oTx)
					{
						oTx.executeSql('INSERT INTO todo(task) VALUES (?)', [sValue], function render(oTrans, aResults)
						{
							var sKey = aResults.insertId;
							self.insertNode(sKey, sValue);
						}, function error(){});
					}, function error()
					{
						alert("Error on saving!");
					}, function success()
					{
					});
				} catch (erError) {
					debugger;
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
			if(!this.isWebSQLSupported())
			{
				alert("Your browser doesn't support WebSQL Please use the last version of Google Chrome!");
				return false;
			}
			this.oClearAll = document.getElementById("clearAll");
			this.oTodoList = document.getElementById('todoList');
			this.setDataBase();
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