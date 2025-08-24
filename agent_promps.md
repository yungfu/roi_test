1. 
使用npm 的workspace创建mono repository项目，包含backend和client两个package；
client基于nextjs框架，ui基于shadcn/ui，采用csr模式，安装recharts库；
backend基于expressjs，采用postgresql数据库，使用typeorm做codefirst，使用tsyringe依赖注入框架；数据库配置在环境文件中；数据库初始化连接时默认为10个连接的连接池；
同时更新.gitignore;
2.
先不要创建具体的数据库实体
3.
创建app，compaign，roidata三个实体类，包含投放日期，appName，出价类型，安装次数，国家地区，当日ROI，一日ROI，七日ROI，3日ROI，14日ROI，30日ROI，60日ROI，90日ROI这些字段，
4.
根据App，Campaign,ROIData 3个实体类，实现对应的Repository
5.
增加一个roifiles的controller，实现restful风格的导入api，使用csv-parser库来执行解析；
csv包含如下的列，
日期：投放日期，
app：app name，
出价类型：CPI，
国家地区，
应用安装.总次数，
当日ROI，
1日ROI，
3日ROI，
7日ROI，
14日ROI，
30日ROI，
60日ROI，
90日ROI
实现对应的Service，将解析出来的数据导入到App,Campaign,ROIData三个数据实体表中，
6.
修改ParseRow中计算isReal0Roi的方法，csv中最大的日期为截至日期，如果投放日期和截至日期的间隔不足对应的POI日期，这种情况下的isReal0Roi是false，比如60日ROI需要截至日期和投放日期间隔大于等于60日；
...
csv中日期是如下的格式"yyyy-MM-dd(weekyday)"，为日期和星期几的组合，不包含时间部，是否满足ROI计算日期时，包含投放和截至日期，因此非当日ROI的判断，应该是日期的间隔+1小于等于ROI的时间段就可以，
7.
增加统计api，包含对应的controller，route，和service；
实现如下的功能：
根据APP.name, Campaign.bidType, Campaign.country来进行数据统计，返回包含投放日期，app，国家，以及当日，1日，3日，7日，14日，30日，60日，90日8个roi数据信息，如果对应的roi数据为0，还要包含ROIData.isReal0Roi信息
...
不需要SatisticsResult中的sumamry，total等总量统计
8.上下文layout.tsx
在ROI Analyze旁边添加一个import连接，点击弹出import窗口，使用shadcn/ui，初始化并安装需要的组件
9.
实现importService，实现导入csv的功能，调用roiFiles 路由中的import api，路径为"/api/roifiles/import"，在import-dialog的button中执行导入时，调用service，进行导入，并展示展示对应的loading或spinner状态
10.
修改actualColumns的获取方式，对column 名字的头尾隐藏的特殊不可见字符进行过滤
11.
优化appservice，在本地缓存apps，查找不到时再去数据库获取
12.
创建Filter Component，包含两部分，第一行为筛选器，从左到右为

用户安装渠道（下拉选择：Apple）
出价类型（下拉选择：CPI）
国家地区（下拉选择：美国、英国等）
APP（下拉选择：App-1、App-2、App-3、App-4、App-5）
第二行为控制器，（两组单选框，水平排列）：
数据显示模式：○ 显示移动平均值 ○ 显示原始数据
Y轴刻度：○ 线性刻度 ○ 对数刻度，
第二行的背景为浅灰色；
Component中添加QueryContext的使用，绑定控制器和过滤器对应的切换行为
13.
使用shadcn中的Select和RadioGroup控件，不要自己定义
14.
优化getStatistics的查询
使用join查询代替从不同repository中取出数据再合并，提高查询的效率；
返回值保持不变；
以Campaign为主表或者左表；
15.
参考importService，实现queryService，要包含以下功能：
包含query方法，返回最终的结果；
从/api/satistics 终结点进行查询，有appName, bidType,country三个可选的query params；
增加默认一分钟的localStorage缓存，缓存未过期从缓存而不是数据库读取，以查询的url和params为缓存的key；
query方法除了包含filterParams外，还包含isLog，isAverage两个可选的bool参数，isLog==true时，数值转换成对数计算的结果，isAverage==true，值为投放日期和其前两天的平均值；log和平均值的计算都在独立的函数中实现，并根据参数应用到查询结果上
16.
根据state变化，调用queryService来执行查询，将查询结果以placementDate为x轴，roidata的day0，day1，day3，day7，day14，day30，day60，day90分别为y轴，创建线性图；
使用es-toolkit来处理防抖，避免用户频繁更改state导致持续请求；
17.
修改Y轴的坐标，不要均匀分布，使每条线之间间距更清晰；
Y轴的刻度仍然是均匀的，每条线的数值相差比较大，均匀刻度的情况下，小数值的线将堆叠在一起，让y轴的刻度非均匀显式；靠近0的地方刻度间隔比较小，越往上刻度间隔越大；
18.
修改Legend，增加点击控制，点击时切换对应的Line的隐藏显示状态，设置Line的hide属性为true或者false，使用usestate来记录状态；
隐藏时对应的Legend设置为灰色；
...
修改每个Legend的Label，使其根据state.dataMode变化，如果dataMode是‘average'移动平均模式，则在Legend的文字后边附加'(7日移动平均)'
19.
把queryService拆分成两部分，queryService和analyzeService两个类
queryService执行和查询的相关的操作，以及查询相关的缓存，仅仅处理关于查询相关的几个参数，appName,bidType,country这几个参数；
新创建analyzeService，把queryService中原来计算移动平均值的部分移动到新的analyzeService中；
修改Chart中加载数据的方式，useEffect中仅仅关注和查询相关的state状态，变化时调用queryService进行数据加载，并将数据存储到useState的queryData state中；
Charts 组件中的chartData，需要根据queryData和dataMode来使用analyzeService进行进一步的计算，analyzeService负责计算线性平均值，或者原始数据，以及对为roidata的值为0，且isReal0Roi为false的数据进行过滤
20.
把chartData改成改成useMemo的数据，不要用effect进行计算；
20.
修改analyze函数，增加预测逻辑：
如果params.doPrediction为true时，调用doPrediction函数，增加预测数据；
doPredict函数使用线性回归算法，对基于placementDate的数据进行预测，生成的预测数据不超过原始数据规模的的10%；
预测不是开始于最后的数据日期，而是过滤掉数据为0，且isReal0Roi为false的数据后的数据集；
预测是针对每一个roi数据集的，比如day0，day1分别有不同的预测数据；
预测应用在所有数据处理逻辑的最后；
返回的结果中需要对预测数据进行标识；
21.
修改doPrediction函数，将数据拆分成多列，对每一列进行单独的线性回归预测；
对每一列的每一个预测值进行标注；
22.
为chart增加一个预测legend，点击时切换doPrediction状态的值为true或者false；
23.
修改doPredictionOnSingleROI函数，预测是在当前数据集的基础上向后预测，而不是说对当前数据集中没有数据的位置进行预测
24.
导入shadcn/ui的toggle按钮，然后使用toggle按钮在components中增加一个darkThemeToggle组件，点击时切换页面的暗色模式；
在global.css中增加对应的暗色class；
在layout.tsx头部，ImportDialog左侧添加darkThemeToggle按钮；切换应用对应的暗色主题class.