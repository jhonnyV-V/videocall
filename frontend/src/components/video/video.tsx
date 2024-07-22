import { createSignal, createEffect, JSX, splitProps } from 'solid-js'
import type { Component } from 'solid-js';

type PropsType = JSX.VideoHTMLAttributes<HTMLVideoElement> & {
  srcObject: MediaStream
}

const Video: Component = (rawProps: PropsType) => {
  const [refVideo, setRefVideo] = createSignal<HTMLVideoElement>(null);
  const [local, props] = splitProps(rawProps, ['srcObject'])

  createEffect(() => {
    if (!refVideo()) return
    refVideo().srcObject = local.srcObject
  });

  return <video class='w-4/12 h-4/12' ref={setRefVideo} {...props} />
};


export default Video;
