// singleton-base.ts
export abstract class SingletonBase {
    // 1. Static Registry: Stores the unique instance for each subclass type
    private static instances = new Map<new () => SingletonBase, SingletonBase>();

    // Protected constructor: Prevents direct 'new' calls from outside subclasses
    public constructor() {
        const Class = this.constructor as new () => SingletonBase;
        // Optional: Add a check here to ensure the instance isn't already 
        // being created to enforce getInstance() even internally.
        if (SingletonBase.instances.has(Class)) {
            throw new Error("Use Class.getInstance() to get the singleton instance.");
       }
    }

    // 2. Generic Static getInstance() Method
    // This is the core logic that handles Singleton-per-subclass
    public static getInstance<T extends SingletonBase>(this: new () => T): T {
        const Class = this as new () => T;
        
        if (!SingletonBase.instances.has(Class)) {
            const instance = new Class();
            SingletonBase.instances.set(Class, instance);
        }
        
        return SingletonBase.instances.get(Class) as T;
    }
}