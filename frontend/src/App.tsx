import type { Component } from 'solid-js';
import { Button } from "@/components/ui/button";
import { useNavigate } from '@solidjs/router';

const App: Component = () => {
  const navigate = useNavigate();

  function handleClick() {
    navigate("/room/1?admin=1")
  }

  return (
    <main class="bg-gray-950 text-green-500 w-screen h-screen flex">
      <section class='flex flex-col w-full justify-center content-center text-center'>
        <p class="text-4xl justify-content content-center text-center mb-5">
          Hello!
        </p>
        <div>
          <Button
            size='lg'
            variant='outline'
            class='text-3xl border-2 border-green-500 rounded'
            onClick={handleClick}
          >
            Create Room
          </Button>
        </div>
      </section>
    </main>
  );
};

export default App;
