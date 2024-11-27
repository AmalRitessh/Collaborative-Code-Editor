from flask import Flask, render_template, url_for,request,jsonify
import os
import shutil
import subprocess
import uuid

app = Flask('__name__')

@app.route('/')
def index():
	return render_template('index.html')

@app.route('/python',methods=['POST','GET'])
def python():
	if request.method  == 'POST':

		code = request.get_json().get('codeVal')
		inputVal = request.get_json().get('inputVal')

		output = code_exe("python",code,inputVal)
		data = {'result':output}
		
		return jsonify(data)
	else:
		return render_template('python.html')

@app.route('/cpp',methods=['POST','GET'])
def cpp():
	if request.method  == 'POST':
		
		code = request.get_json().get('codeVal')
		inputVal = request.get_json().get('inputVal')

		output = code_exe("cpp",code,inputVal)
		data = {'result':output}
		return jsonify(data)
	else:
		return render_template('cpp.html')

def code_exe(language,code,inputVal):

	extension = {"python":".py","cpp":".cpp"}
	fileName = language+"_code"+extension[language]
	sessionId = str(uuid.uuid4())

	folderPath = os.path.join("temp", sessionId)
	filePath = os.path.join(folderPath, fileName)

	os.makedirs(folderPath, exist_ok=True)

	with open(filePath, "w") as f:
		f.write(code)
	f.close()

	try:
		if language == "python":
			execute = subprocess.run(["python3",filePath],timeout=10,input=inputVal,capture_output=True,text=True)
			if execute.returncode!=0:
				if os.path.exists(folderPath):
					shutil.rmtree(folderPath)
				return execute.stderr
			if os.path.exists(folderPath):
				shutil.rmtree(folderPath)
			return execute.stdout
		
		elif language == "cpp":
			command = ["g++", "-o", f"{folderPath}/{fileName}_out", filePath]
			compileCode = subprocess.run(command,capture_output=True,text=True)
			if compileCode.returncode!=0:
				if os.path.exists(folderPath):
					shutil.rmtree(folderPath)
				return compileCode.stderr

			execute = subprocess.run(f"./{folderPath}/{fileName}_out",timeout=10,input=inputVal,capture_output=True,text=True)
			if os.path.exists(folderPath):
				shutil.rmtree(folderPath)
			return execute.stderr if execute.returncode != 0 else execute.stdout
	
	except subprocess.TimeoutExpired:
		if os.path.exists(folderPath):
			shutil.rmtree(folderPath)
		return "Timeout expired. The code execution took too long."


if __name__ == '__main__':
	app.run(debug=True)