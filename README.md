## TODO :

	- generate require config off of the bower.json file.
	- add DB mongo support

## Folder structure
```
| - public/
| -- assets/
| --- assets/css
| --- assets/js
| --- assets/js-dev
| --- assets/imgs
| - db/ [TODO]
| - sass/
| - app.js
| - Gruntfile.js
| - bower.json
| - package.json
| - README.md
* - node_modules/
* - bower_components/
```



## Setup Local instance 
 
### Install compass:
```
	gem install compass 
```
### Install node modules required
```
	npm update
	npm update -g bower
	npm install
```
### Install bower packages
```
	grunt setup
```
	(this will install all packages into the bower_components and then copy them into js-dev/_libs)


## Running Locally


### Command Line:
```
	node app.js
```
### during development to grunt watch
```
	grunt 
```
### to build files via grunt/r.js
```
	grunt build
```
	


## Adding custom front end libraries with bower

in bower.json add the dependency needed.
 	to search for a specific dependency in Command Line:
 		bower search name



	