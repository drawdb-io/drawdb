import { useState, useEffect } from "react";

const DISCOVERY_DOCS = [
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
];
const SCOPES = "https://www.googleapis.com/auth/drive.file";

export const useGoogleDrive = () => {
    const [gapiLoaded, setGapiLoaded] = useState(false);
    const [gisLoaded, setGisLoaded] = useState(false);
    const [tokenClient, setTokenClient] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const loadGapi = () => {
            const script = document.createElement("script");
            script.src = "https://apis.google.com/js/api.js";
            script.onload = () => {
                window.gapi.load("client:picker", async () => {
                    await window.gapi.client.init({
                        apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
                        discoveryDocs: DISCOVERY_DOCS,
                    });
                    setGapiLoaded(true);
                });
            };
            document.body.appendChild(script);
        };

        const loadGis = () => {
            const script = document.createElement("script");
            script.src = "https://accounts.google.com/gsi/client";
            script.onload = () => {
                const client = window.google.accounts.oauth2.initTokenClient({
                    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                    scope: SCOPES,
                    callback: (tokenResponse) => {
                        if (tokenResponse && tokenResponse.access_token) {
                            setIsAuthenticated(true);
                        }
                    },
                });
                setTokenClient(client);
                setGisLoaded(true);
            };
            document.body.appendChild(script);
        };

        loadGapi();
        loadGis();
    }, []);

    const login = () => {
        if (tokenClient) {
            tokenClient.requestAccessToken({ prompt: "consent" });
        }
    };

    const saveFileToDrive = async (fileContent, fileName, mimeType = "application/json") => {
        if (!isAuthenticated) {
            throw new Error("User not authenticated");
        }

        try {
            const file = new Blob([fileContent], { type: mimeType });
            const metadata = {
                name: fileName,
                mimeType: mimeType,
            };

            const accessToken = window.gapi.client.getToken().access_token;
            const form = new FormData();
            form.append(
                "metadata",
                new Blob([JSON.stringify(metadata)], { type: "application/json" })
            );
            form.append("file", file);

            const response = await fetch(
                "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
                {
                    method: "POST",
                    headers: new Headers({ Authorization: "Bearer " + accessToken }),
                    body: form,
                }
            );
            const data = await response.json();
            return data.id;
        } catch (error) {
            console.error("Error saving to Drive", error);
            throw error;
        }
    };

    const openPicker = (onFilePicked) => {
        if (!gapiLoaded || !isAuthenticated) {
            console.error("Google API not loaded or user not authenticated");
            return;
        }

        const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
        view.setMimeTypes("application/json,application/vnd.google-apps.file");

        const picker = new window.google.picker.PickerBuilder()
            .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
            .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
            .setAppId(import.meta.env.VITE_GOOGLE_APP_ID)
            .setOAuthToken(window.gapi.client.getToken().access_token)
            .addView(view)
            .setCallback(async (data) => {
                if (data.action === window.google.picker.Action.PICKED) {
                    const fileId = data.docs[0].id;
                    const fileName = data.docs[0].name;
                    try {
                        const response = await window.gapi.client.drive.files.get({
                            fileId: fileId,
                            alt: "media",
                        });
                        onFilePicked(response.result, fileName);
                    } catch (err) {
                        console.error("Error downloading file", err);
                    }
                }
            })
            .build();
        picker.setVisible(true);
    };

    return { login, isAuthenticated, saveFileToDrive, openPicker, gapiLoaded, gisLoaded };
};
