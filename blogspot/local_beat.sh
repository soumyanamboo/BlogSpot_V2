#! /bin/sh
echo "====================================================="
echo "This will set up the local virtual environment"
echo "And the install all the required python libraries"
echo "This can be rerun without any issues"
echo "-----------------------------------------------------"
if [ -d "venv" ];
then
    echo "Enabling virtual environment..."
else
    echo "No virtual environment. Please run setup.sh first"
    exit N
fi 

#Activate virtual environment
. venv/bin/activate
export FLASK_APP=main:dev_app
export ENV=development
celery -A blog_app_api.celery beat --max-interval 1 -l info
deactivate