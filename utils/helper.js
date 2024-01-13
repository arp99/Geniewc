const fs = require('fs').promises

const ReservedFlags = {
  c: "c", //bytes
  l: "l", //lines
  w: "w", //words
  m: "m", //characters
};

/**
 * Checks if the argument passed is a reserved flag with a specific functionality or not
 */
const isReservedFlag = (arg) => {
  //first of all flag should start with -
  if (typeof arg !== "string") {
    return false;
  } else {
    if (!arg.startsWith("-")) {
      return false;
    } else {
      // check if the flag value is a reserved flag or not
      const flag = arg.slice(1);
      if (ReservedFlags[flag]) {
        return true;
      }
      return false;
    }
  }
};

/**
 *
 * @param {String} path path of the file to be parsed
 * returns true if the path provided is a valid file path, not a random string
 */
const checkIfTextFile = (path) => {
  var pattern =
    /^(\/[A-Za-z]:|[\/\\])((?!\.{2,})[^\/\\])+([\/\\][^\/\\]+)*[\/\\][^\/\\]+\.(txt|md|csv|json|xml|log|html)$/i;

  // Check if the path matches the pattern
  return pattern.test(path);
};

const checkIfFileExists = async (path) => {
  try {
    // Check if the file exists using fs.promises.access
    await fs.access(path, fs.constants.F_OK);
    return true; // File exists
  } catch (error) {
    return false; // File does not exist
  }
}

module.exports = {
  ReservedFlags,
  isReservedFlag,
  checkIfTextFile,
  checkIfFileExists
}


