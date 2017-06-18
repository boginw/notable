export default class InputWatch{
    map:any = {};
    intervals:any = {};

    public ev_kdown(ev){
        this.map[ev.key] = true;
        ev.preventDefault();
        return;
    }

    public ev_kup(ev){
        this.map[ev.key] = false;
        ev.preventDefault();
        return;
    }

    public key_down(key){
        return this.map[key];
    }

    public keys_down_array(array){
        for(var i = 0; i < array.length; i++)
            if(!this.key_down(array[i]))
                return false;

        return true;
    }

    public keys_down_arguments(){
        return this.keys_down_array(Array.from(arguments));
    }

    public clear(){
        this.map = {};
    }

    public watch_loop(keylist, callback){
        return ()=>{
            if(this.keys_down_array(keylist))
                callback();
        }
    }

    public watch(name, callback, ...args:any[]){
        this.intervals[name] = setInterval(this.watch_loop(args, callback), 1000/24);
    }

    public unwatch(name){
        clearInterval(this.intervals[name]);
        delete this.intervals[name];
    }

    public detach(){
        parent.removeEventListener("keydown", this.ev_kdown);
        parent.removeEventListener("keyup", this.ev_kup);
    }

    public attach(){
        parent.addEventListener("keydown", this.ev_kdown);
        parent.addEventListener("keyup", this.ev_kup);
    }

    constructor(private parent?:HTMLElement){}
}