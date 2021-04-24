GitTools = {
    Version: "0.1",
    Command: require("child_process"),
    Path: require('path'),
    Files: [],
    FileN: 0,
    MenuItems: {list: [], gitopen: null, gitcommit: null, gitpush: null, gitpull: null},
    GitExecute: function(workpath, commands) {
        var commands_string = "";
        if (commands.length > 0)
            commands_string = "&&" + commands.join(" && ");

        GitTools.Command.exec(`start "" "%SystemDrive%\\Program Files\\Git\\git-bash.exe" -c "echo GitTools! && cd ${workpath} ${commands_string} && /usr/bin/bash --login -i"`);
    },
    GitOpen: function() {
        GitTools.GitExecute(GitTools.ProjectDirectory(), []);
    },
    GetCommitName: function(callback) {
        let GmlFile = $gmedit["gml.file.GmlFile"];
        var ntab = new GmlFile("Commit Name", "__CommitName" + (++GitTools.FileN) + "__.", $gmedit["file.kind.misc.KPlain"].inst, "");
        GmlFile.openTab(ntab);
        GitTools.Files.push({file: ntab, callback: callback});
    },
    GitOpenCommit: function() {
        GitTools.GetCommitName((commit) => {
            if (commit != "")
                GitTools.GitExecute(GitTools.ProjectDirectory(), ["git add *", `git commit -m "${commit}"`, "close"]);
        });
    },
    GitOpenPush: function() {
        GitTools.GitExecute(GitTools.ProjectDirectory(), ["git push", "close"]);
    },
    GitOpenPull: function() {
        GitTools.GitExecute(GitTools.ProjectDirectory(), ["git pull"]);
    },
    ProjectDirectory: function() {
        return GitTools.Path.dirname($gmedit["gml.Project"].current.path);
    },
    CheckFile: function(gmlfile, trash) {
        console.log("checking...");
        for (var i = 0; i < GitTools.Files.length; i++) {
            var file = GitTools.Files[i];
            if (file.file == gmlfile.file) {
                var code = gmlfile.file.readContent();
                Electron_FS.unlinkSync(GitTools.ProjectDirectory() + "\\" + gmlfile.file.path);
                file.callback(code);
                GitTools.Files.splice(i, 1);
                break;
            }
        }
    }
};

(function() {
    GMEdit.register("GitTools", {
        init: function() {
            let MainMenu = $gmedit["ui.MainMenu"].menu;
            for (let [index, mainMenuItem] of MainMenu.items.entries()) {
                if (mainMenuItem.id != "close-project") continue;
                GitTools.MenuItems.list = [
                    new Electron_MenuItem({
                        id: "builder-sep",
                        type: "separator"
                    }),
                    GitTools.MenuItems.gitopen = new Electron_MenuItem({
                        id: "gittools-open",
                        label: "GitBash Open",
                        accelerator: "F10",
                        click: GitTools.GitOpen
                    }),
                    GitTools.MenuItems.gitcommit = new Electron_MenuItem({
                        id: "gittools-commit",
                        label: "Git Commit",
                        accelerator: "F11",
                        click: GitTools.GitOpenCommit
                    }),
                    GitTools.MenuItems.gitpush = new Electron_MenuItem({
                        id: "gittools-push",
                        label: "Git Push",
                        accelerator: "F12",
                        click: GitTools.GitOpenPush
                    }),
                    GitTools.MenuItems.gitpull = new Electron_MenuItem({
                        id: "gittools-pull",
                        label: "Git Pull",
                        click: GitTools.GitOpenPull
                    })
                ];
                for (let newItem of GitTools.MenuItems.list) {
                    MainMenu.insert(++index, newItem);
                }
                break;
            }
            let AceCommands = $gmedit["ace.AceCommands"];
            AceCommands.add({ name: "gitopen", bindKey: {win: "F10", mac: "F10"}, exec: GitTools.GitOpen }, "GitOpen");
            AceCommands.addToPalette({name: "GitTools: Open GitBash in project directory", exec: "gitopen", title: "GitOpen"});

            AceCommands.add({ name: "gitcommit", bindKey: {win: "F11", mac: "F11"}, exec: GitTools.GitOpenCommit }, "GitCommit");
            AceCommands.addToPalette({name: "GitTools: Create commit", exec: "gitcommit", title: "GitCommit"});

            AceCommands.add({ name: "gitpush", bindKey: {win: "F12", mac: "F12"}, exec: GitTools.GitOpenPush }, "GitPush");
            AceCommands.addToPalette({name: "GitTools: Git Push", exec: "gitpush", title: "GitPush"});

            GMEdit.on("fileClose", GitTools.CheckFile);
        }
    });
})();