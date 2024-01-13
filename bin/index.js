#!/usr/bin/env node
const fs = require("fs");
const readline = require("readline");

const {
  checkIfTextFile,
  checkIfFileExists,
  isReservedFlag,
  ReservedFlags,
} = require("../utils/helper");

// The above line is way to of specifying which interpreter to use to run this file as an executable in unix like platorms
class Geniewc {
  constructor(args) {
    this.args = args;
  }

  // returns the output in the desired format
  getOutput(flagValue, stream, textFilePath = null) {
    switch (flagValue) {
      case ReservedFlags.c:
        this.getBytesCount(stream)
          .then((bytes) => {
            if (textFilePath) {
              console.log(`${bytes} ${textFilePath}`);
            } else {
              console.log(bytes);
            }
          })
          .catch((err) => {
            console.log(
              "Unexpted error occured calculating file size: ",
              err.message
            );
          });

        break;
      case ReservedFlags.l:
        this.getLinesCount(stream)
          .then((lines) => {
            if (textFilePath) {
              console.log(`${lines} ${textFilePath}`);
            } else {
              console.log(lines);
            }
          })
          .catch((err) => {
            console.log(
              "Unexpted error occured calculating number of lines: ",
              err.message
            );
          });
        break;
      case ReservedFlags.w:
        this.getWordsCount(stream)
          .then((words) => {
            if (textFilePath) {
              console.log(`${words} ${textFilePath}`);
            } else {
              console.log(words);
            }
          })
          .catch((err) => {
            console.log(
              "Unexpted error occured calculating number of words: ",
              err.message
            );
          });

        break;
      case ReservedFlags.m:
        this.getCharsCount(stream)
          .then((chars) => {
            if (textFilePath) {
              console.log(`${chars} ${textFilePath}`);
            } else {
              console.log(chars);
            }
          })
          .catch((err) => {
            console.log(
              "Unexpted error occured calculating number of characters: ",
              err.message
            );
          });

        break;
      default:
        Promise.all([
          this.getBytesCount(stream),
          this.getLinesCount(stream),
          this.getWordsCount(stream),
        ])
          .then((res) => {
            const [bytesCount = 0, linesCount = 0, wordsCount = 0] = res;
            if (textFilePath) {
              console.log(
                `${linesCount} ${wordsCount} ${bytesCount} ${textFilePath}`
              );
            } else {
              console.log(`${linesCount} ${wordsCount} ${bytesCount} `);
            }
          })
          .catch((err) => {
            console.log(
              "Unexpted error occured while procesing file: ",
              err.message
            );
          });
    }
  }

  /**
   * Logs Bytes count in a text file or from standard input
   *
   */
  getBytesCount(stream) {
    // reads the file in chunks, calculating the size incrementally without loading the entire file into memory.

    return new Promise((resolve, reject) => {
      let bytesCount = 0;
      // stream.on('data', ...) event is triggered for each chunk of data, and the size is updated accordingly.
      stream.on("data", (chunk) => {
        bytesCount += chunk.length;
      });
      // stream.on('end', ...) event is triggered, and the total size is resolved.
      stream.on("end", () => {
        resolve(bytesCount);
      });
      stream.on("error", (err) => {
        reject(err);
      });
    });
  }

  /**
   * Logs the number of lines present in the text file passed
   */
  getLinesCount(stream) {
    return new Promise((resolve, reject) => {
      const readInstance = readline.createInterface({
        input: stream,
        crlfDelay: Infinity,
      });

      let lineCount = 0;

      readInstance.on("line", () => {
        lineCount += 1;
      });

      readInstance.on("close", () => {
        resolve(lineCount);
      });

      readInstance.on("error", (err) => {
        reject(err);
      });
    });
  }

  /**
   * Logs the number of words present in the text file
   */
  getWordsCount(stream) {
    return new Promise((resolve, reject) => {
      const readInstance = readline.createInterface({
        input: stream,
        crlfDelay: Infinity,
      });

      let wordCount = 0;

      readInstance.on("line", (line) => {
        //checks if the line is not empty
        if (/\S/.test(line)) {
          const words = line.split(/\s+/);
          wordCount += words.filter((word) => word !== "").length;
        }
      });

      readInstance.on("close", () => {
        resolve(wordCount);
      });

      readInstance.on("error", (err) => {
        reject(err);
      });
    });
  }

  /**
   *
   * Logs the number of characters present in the text file
   */
  getCharsCount(stream) {
    return new Promise((resolve, reject) => {

      let charCount = 0;

      stream.on("data", (chunk) => {
        charCount += chunk.toString().length;
      });

      stream.on("end", () => {
        resolve(charCount);
      });

      stream.on("error", (err) => {
        reject(err);
      });
    });
  }

  main() {
    try {
      // first check the args length
      const argsCount = this.args.length;
      if (!argsCount) {
        console.log("Please pass a flag/file name");
      } else {
        // in case of 1 arg, passed: we need to check if its a text file path, or a valid reserved flag else throw err
        // in case of 2 arg, check if the first arg is a valid flag and second arg is valid file path
        const [argValue] = this.args;
        if (argsCount === 1) {
          // check if valid text file path and not random string
          if (checkIfTextFile(argValue)) {
            checkIfFileExists(argValue)
              .then((exists) => {
                const stream = fs.createReadStream(argValue);
                if (exists) {
                  this.getOutput(null, stream, argValue);
                } else {
                  console.log("File not found");
                }
              })
              .catch((err) => {
                console.log(
                  `Unexpected error occured looking for the file: ${err?.message}`
                );
              });
          } else {
            if (isReservedFlag(argValue.toLowerCase())) {
              const flagValue = argValue.slice(1).toLowerCase();
              // read from standard input if no file given
              const stream = process.stdin;
              this.getOutput(flagValue, stream);
            } else {
              console.log("Please Enter a valid text file path");
            }
          }
        } else {
          const [flag, textFilePath] = this.args;
          // check if the flag is valid flag ignoring the case of it
          if (isReservedFlag(flag.toLowerCase())) {
            if (checkIfTextFile(textFilePath)) {
              checkIfFileExists(textFilePath)
                .then((exists) => {
                  if (exists) {
                    // continue with file processing of the text file
                    //The character of the flag except the precending hyphen and ignoring the case
                    const flagValue = flag.slice(1).toLowerCase();
                    const stream = fs.createReadStream(textFilePath);
                    this.getOutput(flagValue, stream, textFilePath);
                  } else {
                    console.log("File not found");
                  }
                })
                .catch((err) => {
                  console.log(
                    `Unexpected error occured looking for the file: ${err?.message}`
                  );
                });
            } else {
              console.log("Please Enter a valid text file path");
            }
          } else {
            console.log("Please enter a valid flag");
          }
        }
      }
    } catch (err) {
      console.log("Something went wrong: ", err?.message);
    }
  }
}

/**
 * Create an instance of genie and pass any command line arguments passed
 */
const genie = new Geniewc(process.argv.slice(2));
genie.main();
