import { Runtime } from "@observablehq/runtime";

const runtime = new Runtime({ color: "red" });

class Inspector {
  pending() {
    console.log("it is pending");
  }

  fulfilled(value, name) {
    console.log(`${name} is fulfilled: ${value}`);
  }

  rejected(error, name) {
    console.log(`${name} is rejected: ${error}`);
  }
}

const module = runtime.module();

module.variable().define("birthday", new Date("1991-04-29"));
const now = module.variable().define("now", async function* () {
  while (true) {
    await sleep(1000);
    yield new Date();
  }
});
module
  .variable(new Inspector())
  .define("age", ["birthday", "now"], (birthday, now) => {
    return new Date(now.getTime() - birthday.getTime());
  });

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

// while (true) {
//   await sleep(1000);
//   now.define().define("now", new Date());
// }
