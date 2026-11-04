import QtQuick 2.12
import QtQuick.Layouts 1.3
import Lomiri.Components 1.3
import Lomiri.Content 1.3
import QtWebEngine 1.10
import io.thp.pyotherside 1.5

MainView {
    id: rootMain
    objectName: "mainView"
    applicationName: "curio-pdf"
    automaticOrientation: true

    width: units.gu(45)
    height: units.gu(80)

    backgroundColor: "#111111"

    property var activeTransfer: null
    property string pendingExportFilePath: ""

    function getLocalizedText(key) {
        var lang = Qt.locale().name.substring(0, 2).toLowerCase();
        if (lang === "pt") {
            if (key === "import") return "Escolher Documento PDF";
            if (key === "export") return "Salvar Documento com Destaques";
        }
        if (lang === "es") {
            if (key === "import") return "Elegir documento PDF";
            if (key === "export") return "Guardar documento con destacados";
        }
        // Fallback universal: Inglês
        if (key === "import") return "Choose PDF Document";
        if (key === "export") return "Save Document with Highlights";
        return "";
    }

    PageStack {
        id: pageStack
        anchors.fill: parent

        Component.onCompleted: {
            pageStack.push(mainPage)
        }

        Page {
            id: mainPage
            anchors.fill: parent
            header: PageHeader {
                id: mainHeader
                visible: false
                title: "Curió PDF"
            }

            WebEngineProfile {
                id: curioProfile
                storageName: "curio-pdf-profile"
                offTheRecord: false
                httpCacheType: WebEngineProfile.NoCache
                persistentCookiesPolicy: WebEngineProfile.ForcePersistentCookies
                httpUserAgent: "Mozilla/5.0 (Linux; Ubuntu Touch) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36 CurioPDF/1.1"
            }

            WebEngineView {
                id: webview
                anchors.fill: parent
                profile: curioProfile
                zoomFactor: Math.max(1.0, units.gu(1) / 8.5)

                settings.localContentCanAccessRemoteUrls: true
                settings.localContentCanAccessFileUrls: true
                settings.javascriptEnabled: true
                settings.localStorageEnabled: true
                settings.accelerated2dCanvasEnabled: true

                onNewViewRequested: function(request) {
                    Qt.openUrlExternally(request.requestedUrl);
                }

                onJavaScriptConsoleMessage: function(level, message, lineNumber, sourceID) {
                    console.log("[JS Console] " + message + " (" + sourceID + ":" + lineNumber + ")");
                }
            }
        }
    }

    // Seletor do Lomiri Content Hub para IMPORTAR (Abrir) documentos PDF
    Component {
        id: importPickerComponent
        Page {
            id: importPickerPage
            property var app: rootMain

            header: PageHeader {
                title: rootMain.getLocalizedText("import")
            }

            ContentPeerPicker {
                anchors {
                    fill: parent
                    topMargin: importPickerPage.header.height
                }
                visible: true
                contentType: ContentType.Documents
                handler: ContentHandler.Source

                onPeerSelected: {
                    peer.selectionType = ContentTransfer.Single;
                    var transfer = peer.request();
                    rootMain.activeTransfer = transfer;
                    transfer.stateChanged.connect(function() {
                        if (transfer && transfer.state === ContentTransfer.Charged) {
                            rootMain.handleChargedTransfer(transfer);
                        }
                    });
                    pageStack.pop();
                }

                onCancelPressed: {
                    pageStack.pop();
                }
            }
        }
    }

    // Seletor do Lomiri Content Hub para EXPORTAR (Salvar/Compartilhar) o PDF anotado
    Component {
        id: exportPickerComponent
        Page {
            id: exportPickerPage
            property var app: rootMain

            header: PageHeader {
                title: rootMain.getLocalizedText("export")
            }

            ContentPeerPicker {
                anchors {
                    fill: parent
                    topMargin: exportPickerPage.header.height
                }
                visible: true
                contentType: ContentType.Documents
                handler: ContentHandler.Destination

                onPeerSelected: {
                    var transfer = peer.request();
                    if (transfer.state === ContentTransfer.InProgress) {
                        transfer.items = [
                            contentItemComponent.createObject(rootMain, { "url": "file://" + rootMain.pendingExportFilePath })
                        ];
                        transfer.state = ContentTransfer.Charged;
                    }
                    pageStack.pop();
                }

                onCancelPressed: {
                    pageStack.pop();
                }
            }
        }
    }

    Component {
        id: contentItemComponent
        ContentItem {}
    }

    function handleChargedTransfer(transfer) {
        if (!transfer || !transfer.items) return;
        for (var i = 0; i < transfer.items.length; i++) {
            var fileUrl = transfer.items[i].url.toString();
            python.call("backend.import_file", [fileUrl], function(res) {
                webview.runJavaScript("window.dispatchEvent(new CustomEvent('ut-check-pending-files'));");
            });
        }
        transfer.finalize();
    }

    // Recebe arquivos abertos por outros apps ("Abrir com Curió PDF") via Lomiri Content Hub
    Connections {
        target: ContentHub

        onImportRequested: function(transfer) {
            handleChargedTransfer(transfer);
        }

        onShareRequested: function(transfer) {
            handleChargedTransfer(transfer);
        }
    }

    Python {
        id: python

        Component.onCompleted: {
            var rawUrl = Qt.resolvedUrl("../src").toString();
            var srcPath = rawUrl.replace(/^file:\/\//, "");
            addImportPath(srcPath);

            setHandler("request-import-pdf", function(payload) {
                pageStack.push(importPickerComponent);
            });

            setHandler("request-export-pdf", function(filePath) {
                rootMain.pendingExportFilePath = filePath;
                pageStack.push(exportPickerComponent);
            });

            setHandler("pdf-imported", function(payload) {
                webview.runJavaScript("window.dispatchEvent(new CustomEvent('ut-check-pending-files'));");
            });

            importModule("backend", function() {
                call("backend.start_server", [], function(serverUrl) {
                    console.log("[Curió-PDF] Servidor local iniciado em: " + serverUrl);
                    webview.url = serverUrl + "?t=" + Date.now();

                    // Verifica se o app recebeu algum caminho de PDF via argumento (%u)
                    var args = Qt.application.arguments;
                    for (var i = 1; i < args.length; i++) {
                        if (args[i].toLowerCase().indexOf(".pdf") !== -1) {
                            call("backend.import_file", [args[i]], function() {
                                webview.runJavaScript("window.dispatchEvent(new CustomEvent('ut-check-pending-files'));");
                            });
                        }
                    }
                });
            });
        }

        onError: function(traceback) {
            console.log("[Curió-PDF PyOtherSide Error]: " + traceback);
        }
    }
}
