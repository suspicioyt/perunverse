class Overworld {
  constructor(config) {
    this.element=config.element;
    this.canvas=this.element.querySelector(".game-canvas");
    this.ctx=this.canvas.getContext("2d");
    this.map=null;
  }
  startGameLoop() {
    const step=()=>{
      this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
      const cameraPerson=this.map.gameObjects.hero;
      Object.values(this.map.gameObjects).forEach(object=>{
        object.update({
          arrow:this.directionInput.direction,
          map: this.map,
        })
      })
      this.map.drawLowerImage(this.ctx,cameraPerson);
      Object.values(this.map.gameObjects).sort((a,b)=>{
        return a.y-b.y;
      }).forEach(object=>{
        object.sprite.draw(this.ctx,cameraPerson);
      })
      this.map.drawUpperImage(this.ctx,cameraPerson);
      requestAnimationFrame(()=>{
        step();
      })
    }
    step();
  }
  init() {
    this.map=new OverworldMap(window.OverworldMaps.DemoRoom);
    this.map.mountObjects();
    this.directionInput=new DirectionInput();
    this.directionInput.init();
    this.startGameLoop();
    this.map.startCutscene([
      {who:"hero", type:"walk",direction:"down"},
      {who:"hero", type:"walk",direction:"down"},
      {who:"npcA", type:"walk",direction:"left"},
      {who:"npcA", type:"walk",direction:"left"},
      {who:"npcA", type:"stand",direction:"up",time:800},
    ])
  }
}