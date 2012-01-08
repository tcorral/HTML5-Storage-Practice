Core.register('Skin', function(oAction)
{
    var win = window;
    return {
        sIdLightLink: 'light',
        sIdDarkLink: 'dark',
        sKey: 'skin',
        oLightLink: null,
        oDarkLink: null,
        isLocalStorageSupported: function()
        {
            return win.sessionStorage !== undefined && win.sessionStorage !== null;
        },
        getSkin: function()
        {
            App.globals.skin = sessionStorage.getItem(this.sKey);
        },
        init: function()
        {
            if(!this.isLocalStorageSupported())
            {
                alert("Your browser doesn't support LocalStorage! Please use the last version of Google Chrome!");
                return false;
            }
            this.getSkin();
            this.oLightLink = document.getElementById(this.sIdLightLink);
            this.oDarkLink = document.getElementById(this.sIdDarkLink);
            this.setBehaviour();
        },
        setBehaviour: function()
        {
            var self = this;
            $(this.oLightLink).add(this.oDarkLink).click(function()
            {
                self.setSkin(this.id);
                oAction.notify({
                    type: 'changeSkin',
                    skin: this.id
                });
                return false;
            });
        },
        setSkin: function(sSkin)
        {
            sessionStorage.setItem(this.sKey, sSkin);
            this.getSkin();
        }
    };
});