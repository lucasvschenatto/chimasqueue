import Queue from "../../src/Chimas/Queue";
import { expect } from "chai";

let queue: Queue;
const name = "sampleName";
context("Queue", () => {
  beforeEach(() => {
    queue = new Queue(name);
  });
  describe("when calling function getName", () => {
    it("should return the queue name", () => {
      expect(queue.getName()).to.be.equal(name);
    });
  });
  describe("when calling function add", () => {
    it("should add a person to the queue", () => {
      queue.add("joao");
      expect(queue.getGuestList()).to.have.length(1);
    });
    it("should throw if person already is in queue", () => {
      queue.add("joao");
      expect(() => queue.add("joao")).to.throw();
    });
  });
  describe("when calling function remove", () => {
    it("should remove person from queue", () => {
      queue.add("joao");
      expect(queue.getGuestList()).to.have.length(1);
      queue.remove("joao");
      expect(queue.getGuestList()).to.have.length(0);
    });
    it("should throw if person doesn't exist", () => {
      expect(() => queue.remove("joao")).to.throw();
    });
  });
  describe("when calling function clear", () => {
    it("should clear the queue", () => {
      queue.add("joao");
      queue.add("alexia");
      expect(queue.getGuestList()).to.have.length(2);
      queue.clear();
      expect(queue.getGuestList()).to.have.length(0);
      expect(queue.whosWithIt()).to.be.empty;
      expect(queue.whosNext()).to.be.empty;
    });
  });
  describe("when calling function whosWithIt", () => {
    it("Should return the username of the actual user", () => {
      queue.add("joao");
      queue.whosNext();
      expect(queue.whosWithIt()).to.be.equal("joao");
    });
  });
  describe("when calling function whosNext", () => {
    it("should return next person in line, and always repeat", () => {
      queue.add("joao");
      queue.add("daniel");
      queue.add("alexia");
      expect(queue.whosNext()).to.be.equal("joao");
      expect(queue.whosNext()).to.be.equal("daniel");
      expect(queue.whosNext()).to.be.equal("alexia");
      expect(queue.whosNext()).to.be.equal("joao");
      expect(queue.whosNext()).to.be.equal("daniel");
      expect(queue.whosNext()).to.be.equal("alexia");
    });
  });
});