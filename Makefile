SRC_DIR = src
TEST_DIR = test
BUILD_DIR = build

PREFIX = .
DIST_DIR = ${PREFIX}/dist

JS_ENGINE ?= `which node nodejs 2>/dev/null`
COMPILER = ${JS_ENGINE} ${BUILD_DIR}/uglify.js --unsafe
POST_COMPILER = ${JS_ENGINE} ${BUILD_DIR}/post-compile.js

BASE_FILES = ${SRC_DIR}/core.js\
			${SRC_DIR}/create.js\
			${SRC_DIR}/namespace.js\
			${SRC_DIR}/export.js

MODULES = ${SRC_DIR}/intro.js\
	${BASE_FILES}\
	${SRC_DIR}/outro.js

CL = ${DIST_DIR}/classify.js
CL_MIN = ${DIST_DIR}/classify.min.js

CL_VER = $(shell cat version.txt)
VER = sed "s/@VERSION/${CL_VER}/"

DATE= `date`

all: core

core: classify unit lint min
	@@echo "Classify build complete."

${DIST_DIR}:
	@@mkdir -p ${DIST_DIR}

classify: ${CL}

${CL}: ${MODULES} | ${DIST_DIR}
	@@echo "Building" ${CL}

	@@cat ${MODULES} | \
		sed 's/.function..Classify...{//' | \
		sed 's/}...Classify..;//' | \
		sed 's/@DATE/'"${DATE}"'/' | \
		${VER} > ${CL};

unit : classify
	@@if test ! -z ${JS_ENGINE}; then \
		echo "Running unit tests against Classify"; \
		${JS_ENGINE} build/qunit-check.js -q; \
	else \
		echo "You must have NodeJS installed in order to unit test Classify."; \
	fi
		
lint: classify
	@@if test ! -z ${JS_ENGINE}; then \
		echo "Checking Classify against JSLint..."; \
		${JS_ENGINE} build/jslint-check.js ${CL}; \
	else \
		echo "You must have NodeJS installed in order to test Classify against JSLint."; \
	fi

min: classify lint ${CL_MIN}

${CL_MIN}: ${CL}
	@@if test ! -z ${JS_ENGINE}; then \
		echo "Minifying Classify" ${CL_MIN}; \
		${COMPILER} ${CL} > ${CL_MIN}.tmp; \
		${POST_COMPILER} ${CL_MIN}.tmp > ${CL_MIN}; \
		rm -f ${CL_MIN}.tmp; \
	else \
		echo "You must have NodeJS installed in order to minify Classify."; \
	fi

clean:
	@@echo "Removing Distribution directory:" ${DIST_DIR}
	@@rm -rf ${DIST_DIR}
