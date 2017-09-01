var steelwheels = {};

/***************************************************************************
 *                      MISC functions && settings                         *
 ***************************************************************************/ 

//Used to format the KPI numbers
steelwheels.addCommas = function(nStr){
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    x2 = x2.slice(0,3);
    return x1 + x2;
};


//Show or hide elements (charts), depending which measure we choose
steelwheels.changePerspective = function(clickedButton){
    var activeButton = $('.kpiColumn button.active'),
        clickedName = clickedButton.closest('.radioButtonObj').attr('id').split('ButtonObj')[0],
        clickedContainer = $('#' + clickedName + "CenterRow"),
        activeContainer = $('.centerRow.active');
    
    activeContainer.removeClass('active');
    activeButton.removeClass('active');
    clickedButton.addClass('active');
    clickedContainer.addClass('active');
    activeContainer.fadeOut(300, function() {
        clickedContainer.fadeIn(300);
    });
};

steelwheels.startPerspective = function() {
    var activeContainer = $('.centerRow.active');    
    activeContainer.show();
};

$(document).ready(function() {
    steelwheels.startPerspective();    
});

/***************************************************************************
 *                                  Colors                                 *
 ***************************************************************************/ 

//Mapping between product lines and colors
steelwheels.productLines_colorMap = function(){
    
    var colors = ["#96BF3B","#2361AC","#3399FF","#A3D7D5","#B07BB3","#AE6409","#FB96C2","#66C2A5","#5C9FBC","#CA1622","#0025FF","#F62760","#585959","#FF9322","#FFFC36","#82D900","#B0A4E2","#3A1D5C","#FF2D2E","#584D05","#613131","#FFDAC8","#E6C9FE","#CDCD98"];
    var jsonData="";
 
$.ajaxSetup({async: false}); //同步，不异步
    $.getJSON(
        "/pentaho/plugin/cda/api/doQuery?path=/public/dashboard/dashboard3.cda&dataAccessId=linesQuery",
        function(result){
            jsonData="{";
        	$.each(
				result.resultset,
				function(i,row){
					var data = result.resultset;
					if(i<result.resultset.length-1){
						jsonData += '"'+data[i][0]+'":"'+colors[i]+'",';
                        //alert(jsonData);
					}else if(i==result.resultset.length-1){
						jsonData += '"'+data[i][0]+'":"'+colors[i]+'"';     //判断是否为最后一个，区别是最后不加,符号
                        //alert(jsonData);
					}
				}
			)
        jsonData+="}"; 
	});
    
    jsonData =eval('('+ jsonData +')');
    return jsonData;
    
}();
/***************************************************************************
 *                                  Charts                                 *
 ***************************************************************************/

//Global barChart properties 
//(this function is called on the preExecution of the barCharts)
steelwheels.barChartOptions = function() {
    var cd = this.chartDefinition;
    
    //main options
    cd.margins = 0;
    
    //visual options
    cd.plotFrameVisible = false;
    cd.legend = false;
    cd.baseAxisBandSizeRatio = 1;
    cd.barStackedMargin = 0;
    cd.colorMap = steelwheels.productLines_colorMap;
    
    //axis
    cd.axisLabel_font = "lighter 9px 'Open Sans'";
    
    //ortho axis
    cd.orthoAxisVisible = false;
    cd.orthoAxisGrid = true;
    cd.orthoAxisGrid_strokeStyle = "#FFF";
    
    //base axis
    cd.baseAxisGrid = false;    
    cd.baseAxisRule_strokeStyle = "#CCC";
    cd.baseAxisLabel_textStyle = "#666";
    cd.baseAxisTooltipEnabled = false;
    
    cd.hoverable = true;
    cd.bar_strokeStyle = null;
};

//Highlight all the bar (category) when hovering a serie 
//(this function is also called on the preExecution of the barCharts)
steelwheels.barChartHoverableOptions = function() {
    var cd = this.chartDefinition; 
    
    cd.bar_fillStyle = function(scene) {
        var color = this.delegate();
        if(color) {
            var activeScene = scene.active();
            if(activeScene && scene.getCategory() === activeScene.getCategory()) {
                color = color.brighter(0.5);
            }
        }
        return this.finished(color);
    }; 
};

//Global sunburstChart properties 
//(this function is called on the preExecution of the sunburstChart)
steelwheels.sunburstChartOptions = function(colorMap) {    
    var cd = this.chartDefinition;
    
    cd.colorMap = steelwheels.productLines_colorMap;
    cd.valuesVisible = false;
    cd.width = 460;
    cd.height = 460;
    cd.slice_strokeStyle = pvc.finished('white');
    cd.slice_lineWidth = pvc.finished(1);
    cd.colorAxisSliceBrightnessFactor = 0;
    cd.hoverable = true;
    
    //Also Highlight the parent when we are hovering a child
    cd.slice_fillStyle = function(scene) {
        var c = this.delegate();
        return c && scene.isActiveDescendantOrSelf() 
            ? this.finished(c.brighter(0.5))
            : c
            ;
    };
};


//Used by Treemap chart, to simulate the "colorMap" property 
//(this property exists in the other charts, but currently it is not working for Treemap)
//JIRA: http://jira.pentaho.com/browse/CDF-452
function createMappedColorScheme(colorMap) {
    function mappedColorScheme() {  // colorScheme / color scale factory
        var scale = function(key) {
            return pv.color(colorMap[key] || 'transparent');
        };
        return pv.copyOwn(scale, pv.Scale.common);
    }
    
    return mappedColorScheme;
}

steelwheels.treemapChartOptions = function() {    
    var cd = this.chartDefinition;
    var colorMap = steelwheels.productLines_colorMap;
    
    cd.valuesVisible = false;
    cd.width = 460;
    cd.legend = false;
    cd.colorMode = "bySelf";
    cd.colors    = createMappedColorScheme(colorMap);
    cd.colorRole =  'category2';
    cd.ascendant_lineWidth = pvc.finished(3);
    cd.ascendant_strokeStyle = pvc.finished('#FFF');
    cd.leaf_lineWidth = pvc.finished(0.5);
    cd.leaf_strokeStyle = pvc.finished('#FFF');
    cd.hoverable = true;
    
    //Mdify the on-hover highlighting effect (change the bright)
    cd.leaf_fillStyle = function(scene) {
        if (scene.isActive) return this.finished(this.delegate().brighter(0.5));
        else return this.delegate();
    };
    
};

//Styling the baseAxis labels
steelwheels.yearLabelsOptions = function() {
    var cd = this.chartDefinition;
    
    cd.baseAxisTickFormatter = function(value, label) {
        return value.substring(8, 9) + "季度";
    };
    
    cd.baseAxisLabel_textAlign = "center";
    cd.baseAxisOverlappedLabelsMode = "leave";
};


//Styling of the barChart tooltips
steelwheels.kpiTooltipOptions1 = function(prefix) {
    var cd = this.chartDefinition;
    
    cd.tooltipArrowVisible = false;
    cd.tooltipFollowMouse = true;
    cd.tooltipOpacity = 1;
    
    cd.tooltipFormat = function f(){
        var category = this.getCategory();
        var series = this.getSeriesLabel();
        var value = steelwheels.addCommas(this.getValue().toFixed(2));
        var year = category.substring(0,4);
        var quarter = category.substring(8,9);
        var lineClass = series.split(" ")[0];
        
        return "<div class='tooltipContainer'>" +
            "<div class='tooltipTitle'>" + series + "</div>" +  
            "<div class='tooltipSubtitle'>" + year +","+ quarter +"季度"+ "</div>" +  
            "<div class='tooltipValue " + lineClass.toLowerCase() + "'>"+prefix+value+"</div>" + 
        "</div>";
    }
};

steelwheels.kpiTooltipOptions2 = function(prefix) {
    var cd = this.chartDefinition;
    
    cd.tooltipArrowVisible = false;
    cd.tooltipFollowMouse = true;
    cd.tooltipOpacity = 1;
    
    cd.tooltipFormat = function f(){
        var category = this.getCategory();
        var series = this.getSeriesLabel();
        var value = steelwheels.addCommas(this.getValue().toFixed(0));
        var year = category.substring(0,4);
        var quarter = category.substring(8,9);
        var lineClass = series.split(" ")[0];
        
        return "<div class='tooltipContainer'>" +
            "<div class='tooltipTitle'>" + series + "</div>" +  
            "<div class='tooltipSubtitle'>" + year +","+ quarter +"季度"+ "</div>" +  
            "<div class='tooltipValue " + lineClass.toLowerCase() + "'>"+prefix+value+"</div>" + 
        "</div>";
    }
};

steelwheels.kpiTerritoryTooltipOptions = function(prefix) {
    var cd = this.chartDefinition;
    
    cd.tooltipArrowVisible = false;
    cd.tooltipFollowMouse = true;
    cd.tooltipOpacity = 1;
    
    cd.tooltipFormat = function f(){
        var category = this.getCategory();
        var series = this.getSeries();
        var value = steelwheels.addCommas(this.getValue().toFixed(2));
        var lineClass = series.split(" ")[0];
        
        return "<div class='tooltipContainer'>" +
            "<div class='tooltipTitle'>" + series + "</div>" +  
            "<div class='tooltipSubtitle'>" + category + "</div>" +  
            "<div class='tooltipValue " + lineClass.toLowerCase() + "'>"+prefix+value+"</div>" + 
        "</div>";
    }
};

steelwheels.sunburstTooltipOptions1 = function(prefix) {
    var cd = this.chartDefinition;
    
    cd.tooltipArrowVisible = false;
    cd.tooltipFollowMouse = true;
    cd.tooltipOpacity = 1;
    
    cd.tooltipFormat = function f(){

        if(this.scene.group.depth == 1) {
            var category = this.scene.atoms.category.label;
            var value = steelwheels.addCommas(this.scene.getSize().toFixed(2));
            var lineClass = category.split(" ")[0];

            return "<div class='tooltipContainer'>" +
                "<div class='tooltipTitle'>" + category + "</div>" +
                "<div class='tooltipValue " + lineClass.toLowerCase() + "'>"+prefix+value+"</div>" + 
            "</div>";   
            
        } else if(this.scene.group.depth == 2) {
            var category = this.scene.atoms.category.label;
            var category2 = this.scene.atoms.category2.label;
            var value = steelwheels.addCommas(this.scene.getSize().toFixed(2));
            var lineClass = category.split(" ")[0];
            
            return "<div class='tooltipContainer'>" +
                  
                "<div class='tooltipSubtitle'>" + category + "</div>" + 
                "<div class='tooltipTitle'>" + category2 + "</div>" +
                "<div class='tooltipValue " + lineClass.toLowerCase() + "'>"+prefix+value+"</div>" + 
            "</div>";           
        }
    }
    
};

steelwheels.sunburstTooltipOptions2 = function(prefix) {
    var cd = this.chartDefinition;
    
    cd.tooltipArrowVisible = false;
    cd.tooltipFollowMouse = true;
    cd.tooltipOpacity = 1;
    
    cd.tooltipFormat = function f(){

        if(this.scene.group.depth == 1) {
            var category = this.scene.atoms.category.label;
            var value = steelwheels.addCommas(this.scene.getSize().toFixed(0));
            var lineClass = category.split(" ")[0];

            return "<div class='tooltipContainer'>" +
                "<div class='tooltipTitle'>" + category + "</div>" +
                "<div class='tooltipValue " + lineClass.toLowerCase() + "'>"+prefix+value+"</div>" + 
            "</div>";   
            
        } else if(this.scene.group.depth == 2) {
            var category = this.scene.atoms.category.label;
            var category2 = this.scene.atoms.category2.label;
            var value = steelwheels.addCommas(this.scene.getSize().toFixed(0));
            var lineClass = category.split(" ")[0];
            
            return "<div class='tooltipContainer'>" +
                 
                "<div class='tooltipSubtitle'>" + category + "</div>" + 
                "<div class='tooltipTitle'>" + category2 + "</div>" + 
                "<div class='tooltipValue " + lineClass.toLowerCase() + "'>"+prefix+value+"</div>" + 
            "</div>";           
        }
    }
    
};

steelwheels.treemapTooltipOptions = function(prefix) {
    var cd = this.chartDefinition;
    
    cd.tooltipArrowVisible = false;
    cd.tooltipFollowMouse = true;
    cd.tooltipOpacity = 1;
    
    cd.tooltipFormat = function f(){
        var line = this.getCategory();
        var region = this.scene.atoms.category.label;
        var value = steelwheels.addCommas(this.getSize().toFixed(2));
        var lineClass = line.split(" ")[0];
        
        return "<div class='tooltipContainer'>" +
            "<div class='tooltipTitle'>" + line + "</div>" +  
            "<div class='tooltipSubtitle'>" + region + "</div>" +  
            "<div class='tooltipValue " + lineClass.toLowerCase() + "'>"+prefix+value+"</div>" + 
        "</div>";//"$"+value+"
    }
};