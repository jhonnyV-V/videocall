import type { Component } from 'solid-js';
import { Button } from "@/components/ui/button";

const App: Component = () => {
  return (
    <main class="bg-gray-950 text-green-500 w-screen h-screen flex">
      <section class='flex flex-col w-full justify-center content-center text-center'>
        <p class="text-4xl justify-content content-center text-center mb-5">
          Hello!
        </p>
        <Button>
          Create Room
        </Button>
        <button class='text-3xl justify-content content-center text-green-500 border-2 rounded border-green-500'>
          Create Room
        </button>
      </section>
    </main>
  );
};

export default App;
