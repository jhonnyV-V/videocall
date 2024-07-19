import type { Component } from 'solid-js';
import { onCleanup } from "solid-js";
import Websocket from 'websocket';

const Room: Component = () => {
  const connection = new RTCPeerConnection();

  const ws = new Websocket.w3cwebsocket(
    "ws://localhost:8080/websocket",
    undefined,
    undefined,
    { "access-control-allow-origin": "*" },
  );
  ws.onopen = function() {
    console.log("Connected");
  };
  ws.onerror = function(error: Error) {
    console.log("error");
    console.log(error)
  }
  ws.onclose = function() {
    console.log("closed");
  }

  ws.onmessage = async function(message: Websocket.IMessageEvent) {
    console.log("message");
    console.log(message);
    console.log(message.data);

    if (message.data === "createoffer") {
      const offer = await connection.createOffer();
      connection.setLocalDescription(offer);
      ws.send(JSON.stringify(offer))
    }
  }

  //if did not created the call join instead of creating an offer

  onCleanup(() => {
    ws.close()
  })

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
