import type { Component } from 'solid-js';
import { createSignal } from "solid-js";

const App: Component = () => {
  const [displayField, setDisplayField] = createSignal(false);
  return (
    <main class="bg-gray-950 text-green-500 w-screen h-screen flex">
      <section class='flex flex-col w-full justify-center content-center text-center'>
        <p class="text-4xl justify-content content-center text-center" >
          Hello!
        </p>
        <button class='justify-content content-center text-green-500'>
          create room
        </button>
      </section>
    </main>
  );
};

export default App;
