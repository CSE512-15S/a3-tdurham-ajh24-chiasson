# 3D C. Elegans Development
Website to provide interactive visualization of C. Elegans development and related data.

## Development Instructions

### 1 | Clone repository

```
git clone git@github.com:CSE512-15S/a3-tdurham-ajh24-chiasson.git
```

This command can be run from anywhere you want to keep your copy of the project. It create a new directory, which can be renamed to whatever.

### 2 | Move timepoints data into directory 
Currently, I have not comitted the time points data to the repository, so copy this folder (named timepoints) into the main directory.

### 3 | Run local server
For testing, go to the project directory and run the following:

```
python -m SimpleHTTPServer 2255
```

This will start a local server on your local machine -- allowing you to test the site locally. 

Navigate to `http://localhost:2255/` in your browser to view site.
