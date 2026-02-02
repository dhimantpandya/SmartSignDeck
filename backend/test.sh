arr=( "GET" "POST" "PATCH" "DELETE" )
echo enter the module name
read moduleName
echo Please fill the details asked to get your module created 
echo Note : Answers other than Y/y will be consider as NO

for item in "${arr[@]}"
do
    read -p "Do you want to allow USER role to access $item request for $moduleName module?(y/n)" yn
    if [[ $yn == 'y' || $yn == 'Y' ]]
    then
        case $item in 
            "GET") GET=true;;
            "POST") POST=true;;
            "PATCH") PATCH=true;;
            "DELETE") DELETE=true;;
        esac        
    else
        case $item in 
            "GET") GET=false;;
            "POST") POST=false;;
            "PATCH") PATCH=false;;
            "DELETE") DELETE=false;;
        esac
    fi
    echo $GET
    echo $POST
    echo $PATCH
    echo $DELETE
done