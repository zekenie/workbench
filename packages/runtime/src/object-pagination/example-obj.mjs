export const simple = {
  foo: "bar",
  baz: 4,
  no: true,
  bob: null,
  bopple: new Date(),
  booooooop: {
    bar: {
      baz: "bap",
    },
  },
};

class Door {
  constructor(position) {
    this.position = position; // "frontLeft", "frontRight", "rearLeft", "rearRight"
    this.isOpen = false;
    this.isLocked = true;
    this.window = 1.0; // 0 = fully down, 1 = fully up
  }

  toggle() {
    if (!this.isLocked) {
      this.isOpen = !this.isOpen;
      return true;
    }
    return false;
  }

  toggleLock() {
    this.isLocked = !this.isLocked;
  }

  adjustWindow(position) {
    if (position >= 0 && position <= 1) {
      this.window = position;
    }
  }
}

class SteeringWheel {
  constructor() {
    this.angle = 0; // -720 to 720 degrees
    this.heatingEnabled = false;
    this.material = "leather";
    this.controls = {
      cruise: false,
      media: {
        volumeUp: true,
        volumeDown: true,
        nextTrack: true,
      },
    };
  }

  turn(degrees) {
    this.angle = Math.max(-720, Math.min(720, this.angle + degrees));
  }
}

class Engine {
  constructor(type, horsepower) {
    this.type = type;
    this.horsepower = horsepower;
    this.isRunning = false;
    this.temperature = 20; // celsius
    this.oilLevel = 1.0; // percentage
  }

  start() {
    if (!this.isRunning && this.oilLevel > 0.1) {
      this.isRunning = true;
      this.temperature = 40;
    }
  }

  stop() {
    this.isRunning = false;
    this.temperature = 20;
  }
}

class Vehicle {
  constructor(make, model, year) {
    this.make = make;
    this.model = model;
    this.year = year;
    this.doors = {
      frontLeft: new Door("frontLeft"),
      frontRight: new Door("frontRight"),
      rearLeft: new Door("rearLeft"),
      rearRight: new Door("rearRight"),
    };
    this.steeringWheel = new SteeringWheel();
    this.engine = new Engine(
      make === "Tesla" ? "electric" : "gasoline",
      make === "Tesla" ? 450 : 250,
    );
    this.mileage = 0;
    this.fuelLevel = 1.0;
    this.maintenanceHistory = [];
  }
}

class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
}

const complexObject = {
  user: new Person("Alice Smith", 32),
  preferences: {
    theme: "dark",
    notifications: {
      email: true,
      push: false,
      frequency: "weekly",
    },
  },
  vehicles: [
    new Vehicle("Toyota", "Camry", 2020),
    {
      car: new Vehicle("Tesla", "Model 3", 2023),
      settings: {
        autopilot: true,
        customizations: {
          interiorLighting: "ambient",
          displayBrightness: 0.8,
          climatePresets: [
            {
              name: "Morning Commute",
              temperature: 22,
              fanSpeed: 3,
              seatHeating: true,
            },
          ],
        },
      },
    },
  ],
  description:
    "This is an extremely long string that goes well beyond 100 characters to test how systems handle lengthy text content. It includes some random information about the user's profile and their participation in various activities throughout the years.",
  history: {
    posts: [
      {
        id: 1,
        content:
          "Another very long string that exceeds 100 characters - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
        metadata: {
          tags: ["important", "featured"],
          timestamp: new Date("2024-01-15"),
        },
      },
    ],
    comments: {
      recent: {
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        likes: 42,
      },
    },
  },
  settings: new Map([
    ["language", "en"],
    ["timezone", "UTC-5"],
  ]),
};

export default complexObject;
