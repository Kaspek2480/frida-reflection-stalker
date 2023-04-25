# Frida reflection stalker

Best solution to avoid wasting time on static analysis while our target function is large and heavily obfuscated.
 
### Example usage:

Let's say we want to hook a function `protection` that is heavily obfuscated and jadx can't decompile it. We can use frida to hook the function and get execution chain.

![image](https://user-images.githubusercontent.com/33702004/234424163-eb293ab8-e5c0-4677-88f7-9b8850048f02.png)

Simple view:

![image](https://user-images.githubusercontent.com/33702004/234424407-4bfd0275-ae14-424c-baf8-7c3a699bdac1.png)

We can see many invokation using reflection. We can use this script to hook the function and get the execution chain.

First we need to write simple hook to function, in this case we will hook `protection` function. Best way to do this is to use jadx built in script creator.
Just open jadx, open the class that contains the function, right click on the function and select `Copy as frida snipset`.

![image](https://user-images.githubusercontent.com/33702004/234424944-43e423f3-e7db-427f-a7db-7313cc322a9a.png)

Paste the code into `frida_reflection_stalker.js`
That's how it should look like:

![image](https://user-images.githubusercontent.com/33702004/234425425-d868057f-9080-4c77-82db-bb02fc6de5b6.png)

Now you need to mark the moment when function starts and ends execution.
You must insert `intercept = true` before the function starts execution and `intercept = false` after the function ends execution.

Example:
![image](https://user-images.githubusercontent.com/33702004/234425955-ae23e697-3946-4853-8f24-59a7a5e1d5c3.png)

And that's it. Now you can run the script and get the execution chain.

```bash
frida -U -f com.package.name -l frida_reflection_stalker.js --no-pause
```


![image](https://user-images.githubusercontent.com/33702004/234427228-db8c7939-bb63-40b5-829b-0efd552f1189.png)

Boom! We got the execution chain. Our test function checks if the device is rooted. 

Of course, you can use this script to hook any function, not only the one that is heavily obfuscated.

