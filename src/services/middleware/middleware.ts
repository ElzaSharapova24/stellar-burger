import {TWsActions} from "../../types/webSocket-types";
import {Middleware} from "@reduxjs/toolkit";
import {refreshTokenUserRequest} from "../../utils/api";
import {checkResponse} from "../../utils/utils";


export const socketMiddleware: (wsActions: TWsActions) => Middleware = (wsActions) => {
    return (store: { dispatch: any; }) => {
        let socket: WebSocket | null = null;
        let reconnectTimer: number = 0;
        let isConnected: boolean = false;
        let wsUrl: string = '';
        let withTokenRefresh: boolean = false;
        return next => action => {
            const {dispatch} = store;
            const {wsConnect, wsDisconnect, wsConnecting, wsOpen, wsClose, wsMessage, wsError} = wsActions;

            if (wsConnect.match(action)) {
                wsUrl = action.payload.wsUrl;
                withTokenRefresh = action.payload.withTokenRefresh;
                socket = new WebSocket(`${wsUrl}`);
                isConnected = true;
                dispatch(wsConnecting());
            }

            if (socket) {

                socket.onopen = () => {
                    dispatch(wsOpen());
                };

                socket.onerror = event => {
                    // dispatch(wsError);
                    console.log('soket.onerror', event)
                };

                socket.onclose = event => {
                   if (event.code !== 1000) {
                       console.log('soket.onclose error', event);
                       dispatch(wsError(event.code.toString()))
                   }

                    if (event.code === 1000) {
                        console.log('soket.onclose success', event);
                    }

                   if (isConnected && event.code !== 1000) {
                       reconnectTimer = window.setTimeout(() => {
                           dispatch(wsConnect({wsUrl, withTokenRefresh}))
                       }, 3000)
                   }
                };

                socket.onmessage = event => {
                    const {data} = event;
                    const parsedData = JSON.parse(data)
                    console.log(parsedData)
                    if (withTokenRefresh && parsedData.message === 'Invalid or missing token') {
                        refreshTokenUserRequest().then(checkResponse)
                            .then(token => {
                                const newWsUrl = new URL(wsUrl);
                                // @ts-ignore
                                newWsUrl.searchParams.set('token', token.accessToken.replace('Bearer ', ''))
                                dispatch(wsConnect({wsUrl, withTokenRefresh}))
                            })
                            .catch(error => {
                                dispatch(wsError(error.code.toString()))
                            })

                        dispatch(wsClose())
                        return;
                    }

                    dispatch(wsMessage(parsedData));
                }

                if (wsDisconnect.match(action) && socket) {
                    clearTimeout(reconnectTimer);
                    isConnected = false;
                    reconnectTimer = 0;
                    socket.close(1000, 'Работа закончена')

                    dispatch(wsClose());
                }
            }

            next(action);
        };
    }
};
