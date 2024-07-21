import type { Component } from 'solid-js';
import { onCleanup, createResource, createSignal, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import { v4 as uuid } from "uuid";
import Video from 'src/components/video/video';

const USER_EVENT = "USER";
const JOIN_EVENT = "JOIN_ROOM";
const OFFER_EVENT = "OFFER";
const ANSWER_EVENT = "ANSWER";

const [localAudio, setLocalAudio] = createSignal(true);
const [localVideo, setLocalVideo] = createSignal(true);

async function getUserMedia() {
  return await navigator.mediaDevices.getUserMedia({ audio: localAudio(), video: localVideo() });
}

const [localTracks, { mutate: mutateLocalTracks }] = createResource(getUserMedia);

function onMessage(
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
        connection.onicecandidate = function(candidate) {
          console.log("on ice candidate", candidate);
        }
        connection.setLocalDescription(offer);
        ws.send(`${OFFER_EVENT} ${target} ${JSON.stringify(offer)}`)
        connections.set(target, connection)
      }
      console.log("Joined, Connections", connections);
    }

    if (message.data!.startsWith(OFFER_EVENT)) {
      const targetsStr: string = message.data.slice(OFFER_EVENT.length + 1)
      console.log(OFFER_EVENT);
      console.log("message.data", message.data);
      console.log("targetsString", targetsStr);
      const userIdIndex = targetsStr.indexOf(' ');
      const offerId = targetsStr.slice(0, userIdIndex);
      const offer = JSON.parse(targetsStr.slice(userIdIndex + 1));
      const connection = new RTCPeerConnection();
      connection.setRemoteDescription(offer);
      const answer = await connection.createAnswer();
      connection.setLocalDescription(answer);
      connection.onicecandidate = function(candidate) {
        console.log("on ice candidate", candidate);
      }
      connections.set(offerId, connection)
      ws.send(`${ANSWER_EVENT} ${offerId} ${JSON.stringify(answer)}`);
    }

    if (message.data!.startsWith(ANSWER_EVENT)) {
      const targetsStr: string = message.data.slice(ANSWER_EVENT.length + 1)
      console.log(ANSWER_EVENT);
      console.log("message.data", message.data);
      console.log("targetsString", targetsStr);
      const userIdIndex = targetsStr.indexOf(' ');
      const offerId = targetsStr.slice(0, userIdIndex);
      const answer = JSON.parse(targetsStr.slice(userIdIndex + 1));

      const connection = connections.get(offerId);
      connection.setRemoteDescription(answer);
      connections.set(offerId, connection)
      connection.addIceCandidate
    }
  }
}

const Room: Component = () => {
  const id = uuid();
  const params = useParams();
  const roomId = params.roomId;
  const connections = new Map<string, RTCPeerConnection>();

  navigator.mediaDevices.getUserMedia

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
    roomId,
    ws,
    connections,
  );

  onCleanup(() => {
    ws.close();
  });

  //TODO: Make a component for the video

  return (
    <main class="bg-gray-950 text-green-500 w-screen h-screen flex">
      <section class='flex flex-col w-full justify-center content-center text-center'>
        <Show when={!localTracks.loading} fallback={<p>Loading...</p>}>
          <Video srcObject={localTracks()} autoplay muted></Video>
        </Show>
      </section>
    </main>
  );
};

export default Room;
