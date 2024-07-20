import type { Component } from 'solid-js';
import { onCleanup } from "solid-js";
import { useParams } from "@solidjs/router";
import { v4 as uuid } from "uuid";

const USER_EVENT = "USER";
const JOIN_EVENT = "JOIN_ROOM";
const OFFER_EVENT = "OFFER";

function onMessage(
  id: string,
  roomId: string,
  ws: WebSocket,
  connections: Map<string, RTCPeerConnection>,
) {

  return async function(message: MessageEvent) {
    console.log("message");
    console.log(message);
    console.log(message.data);

    if (message.data == USER_EVENT) {
      ws.send(JOIN_EVENT + ' ' + roomId)
      return
    }

    if (message.data!.startsWith('Joined')) {
      const targetsStr: string = message.data.slice(7)
      const targets = targetsStr.split(',');
      for (const target of targets) {
        const connection = new RTCPeerConnection()
        const offer = await connection.createOffer();
        connection.setLocalDescription(offer);
        ws.send(`${OFFER_EVENT} ${target} ${JSON.stringify(offer)}`)
        connections.set(target, connection)
      }
    }
  }
}

const Room: Component = () => {
  const id = uuid();
  const params = useParams();
  const roomId = params.roomId;
  const connections = new Map<string, RTCPeerConnection>();

  const ws = new WebSocket(
    "ws://localhost:8080/websocket",
    //{ "access-control-allow-origin": "*" },
  );

  ws.onopen = async function() {
    console.log("Connected");
    const response = USER_EVENT + " " + id;
    console.log(response);
    ws.send(response);
  };
  ws.onerror = function(error: Event) {
    console.log("error");
    console.log(error);
  };
  ws.onclose = function() {
    console.log("closed");
  };

  ws.onmessage = onMessage(
    id,
    roomId,
    ws,
    connections,
  );

  onCleanup(() => {
    ws.close();
  });

  return (
    <main class="bg-gray-950 text-green-500 w-screen h-screen flex">
      <section class='flex flex-col w-full justify-center content-center text-center'>
        <p class="text-4xl justify-content content-center text-center mb-5">
          Hello!
        </p>
      </section>
    </main>
  );
};

export default Room;
