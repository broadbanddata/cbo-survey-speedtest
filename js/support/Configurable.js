class Configurable {

  _config = {};
  get config(){ return this._config; }

  constructor(){
    /* ... */
  }

  loadConfig(configPath){
    return new Promise((resolve, reject) => {
      if(configPath){

        fetch(configPath).then(res => res.json()).then(config => {
          this._config = (config || {});
          resolve();
        }).catch(reject);

      } else { resolve(); }
    });
  }

}

export default Configurable;