console.log("Script loaded!")

// let ignored_classes = ["com.android", "sun.misc", "com.google.firebase", "android.os.SystemProperties", "javax.net.ssl", "android.util", "android.os", "java.security"]
let ignored_classes = ["sun.misc", "com.google.firebase", "android.os.SystemProperties", "javax.net.ssl"]

let intercept = false;
let logAdvanced = false;

//paste here hooks for specific functions
Java.perform(function () {

    let aaa1 = Java.use("app.tango.o.setNextFocusDownId");
    aaa1["getToken"].overload('android.content.Context').implementation = function () {
        console.log(`aaa1.getToken is called`);
        intercept = true;
        let result = this["getToken"]();
        intercept = false;
        console.log(`aaa1.getToken result=${result}`);
        return result;
    };
});


Java.perform(function () {
    let Pin = Java.use("okhttp3.CertificatePinner$Pin");
    Pin.$init.implementation = function (str, str2) {
        // console.log(`Pin.$init is called: str=${str}, str2=${str2}`);
        this["$init"]("example.com", str2);
    };

    let String = Java.use("java.lang.String")
    let Character = Java.use("java.lang.Character")
    let reflectionMethod = Java.use("java.lang.reflect.Method")
    var classDef = Java.use('java.lang.Class');

    reflectionMethod.invoke.implementation = function (o, oArr) {
        if (!intercept) {
            return this.invoke(o, oArr)
        }

        this.setAccessible(true)
        let invokedMethod = this.getName()
        let invokedClass = this.getDeclaringClass().getName()
        let base = "[INVOKE] class: " + invokedClass + " | method: " + invokedMethod + getAditionalInformationAboutObject(o);

        //ignore some classes
        if (ignoreClass(ignored_classes, invokedClass)) {
            return this.invoke(o, oArr)
        }

        let result = this.invoke(o, oArr)

        //parse arguments with values
        let argsTypeList = ""
        let argsValuesList = ""
        if (oArr != null && oArr.length > 0) {
            //all args
            for (let i = 0; i < oArr.length; i++) {
                let argValue = oArr[i]
                let argType = argValue == null ? "null" : argValue.$className

                argsTypeList += (getShortJavaClass(argType) + ",")
                argsValuesList += (getObjStringValue(argValue) + ",")

                /*if (argType.includes("java.lang.String") && !argType.includes("[")) {
                    argValue = Java.cast(argValue, String);
                    argsValuesList += (argValue + "|")
                }
                if (argType.includes("java.lang.Character")) {
                    argValue = Java.cast(argValue, Character);
                    let charValue = argValue.charValue()
                    let a = Character.toString(charValue).codePointAt(0);
                    argsValuesList += (a + "|")
                }*/
            }

            //delete last comma
            argsTypeList = argsTypeList.substring(0, argsTypeList.length - 1)
            argsValuesList = argsValuesList.substring(0, argsValuesList.length - 1)

            base += " | argsTypes: " + argsTypeList + " | argValues: " + argsValuesList
        }

        let resultStr = getObjStringValue(result);
        console.log(base + " | result: " + resultStr)

        return result
    }

    classDef.forName.overload('java.lang.String', 'boolean', 'java.lang.ClassLoader').implementation = function (str, bool, classLoader) {
        if (!intercept && !logAdvanced) {
            return this.forName(str, bool, classLoader)
        }

        let result = this.forName(str, bool, classLoader)
        console.log("[CLASS] " + str)
        return result
    }

    classDef.getMethod.overload('java.lang.String', '[Ljava.lang.Class;').implementation = function (str, classArr) {
        if (!intercept && !logAdvanced) {
            return this.getMethod(str, classArr)
        }

        let result = this.getMethod(str, classArr)
        console.log("[METHOD] " + str)
        return result
    }

    let dontPrint = ["java.security.cert.X509Certificate"]

    let JavaCharacter = Java.use("java.lang.Character")

    function getObjStringValue(obj) {
        if (obj == null) {
            return "null"
        }

        //everything passed here is Object
        let returnType = obj.$className
        // console.log("result type: " + returnType)

        switch (returnType) {
            case "java.lang.Boolean": {
                return obj
            }
            case "java.lang.String": {
                return obj.toString()
            }
            case "[Ljava.lang.String;": {
                let str = ""
                let obj_ = Java.cast(obj, Java.use("[Ljava.lang.String;"));

                //use Arrays.toString() to get string representation of array
                // console.log("obj: " + JSON.stringify(obj))
                // console.log("obj after cast: " + JSON.stringify(obj_))
                // console.log("obj after cast: " + obj_[0])


                // for (let i = 0; i < arr.length; i++) {
                //     str = str + obj_[i] + ","
                // }
                // console.log("str: " + str + " | length: " + obj_.length)
                return obj_.toString()
            }
            case "java.lang.Character": {
                obj = Java.cast(obj, Java.use("java.lang.Character"));
                let charValue = obj.charValue()

                //codePointAt(0); - used in obfuscation to get char as int

                return Character.toString(charValue)
            }
            case "java.lang.Integer": {
                return obj;
            }
            case "java.util.ArrayList": {
                // let str = ""
                /*for (let i = 0; i < result.size(); i++) {
                    let res = result.get(i)
                    if (contains(dontPrint, res.$className)) continue

                    str = str + result.get(i) + "|"
                }*/
                return "ArrayList"
            }
            case "[B": {
                var b = Java.use('[B')
                var buffer = Java.cast(obj, b);
                var result = Java.array('byte', buffer);

                return toHexString(result)
            }

            default: {
                return returnType
            }

        }
    }

    function getShortJavaClass(className) {
        switch (className) {
            case "java.lang.String": {
                return "String"
            }
            case "java.lang.Character": {
                return "char"
            }
            case "java.lang.Integer": {
                return "int"
            }
            case "java.lang.Boolean": {
                return "boolean"
            }
            case "java.lang.Long": {
                return "long"
            }
            case "java.lang.Float": {
                return "float"
            }
            case "java.lang.Double": {
                return "double"
            }
            case "java.lang.Byte": {
                return "byte"
            }
            case "java.lang.Short": {
                return "short"
            }
            case "java.lang.Void": {
                return "void"
            }
            case "[B": {
                return "byte[]"
            }
            case "[Ljava.lang.String;": {
                return "String[]"
            }
            case "[Ljava.lang.Character;": {
                return "char[]"
            }
            case "[Ljava.lang.Integer;": {
                return "int[]"
            }
            case "[Ljava.lang.Boolean;": {
                return "boolean[]"
            }
            case "[Ljava.lang.Long;": {
                return "long[]"
            }
            case "[Ljava.lang.Float;": {
                return "float[]"
            }
            default: {
                return className
            }
        }
    }

    function getAditionalInformationAboutObject(o) {
        if (o == null) {
            return ""
        }
        let className = o.$className
        switch (className) {
            case "java.io.File": {
                let fileObj = Java.cast(o, Java.use("java.io.File"));
                return " | path: " + fileObj.getPath()
            }
            default: {
                return ""
            }
        }
    }
});

function ignoreClass(arr, str) {
    for (let i = 0; i < arr.length; i++) {
        if (str.includes(arr[i])) {
            return true
        }
    }
    return false
}

function base64bArr(bArr) {
    var b64 = Java.use("android.util.Base64");
    return b64.encodeToString(bArr, 2);
}

function toHexString(byteArray) {
    return Array.from(byteArray, function (byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('')
}