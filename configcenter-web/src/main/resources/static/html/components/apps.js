const appsComponentTemplate = `
<div>
    <el-row>
        <el-col>
            <el-form :v-model="queryAppsForm" :inline="true" size="small">
                <el-form-item>
                    <el-input v-model="queryAppsForm.appId" clearable placeholder="应用id"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-input v-model="queryAppsForm.parent" clearable placeholder="父应用"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" icon="el-icon-search" @click="queryApps">查询</el-button>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" icon="el-icon-plus" @click="addAppDialogVisible = true">新增</el-button>
                </el-form-item>
            </el-form>
        </el-col>
    </el-row>
    <el-table :data="apps" v-loading="appsLoading" border stripe>
        <el-table-column prop="appId" label="应用id"></el-table-column>
        <el-table-column label="备注">
            <template slot-scope="{ row }">
                <span v-if="!row.editing">{{ row.memo }}</span>
                <el-input v-else v-model="row.editingMemo" size="small" clearable placeholder="请输入备注"></el-input>
            </template>
        </el-table-column>
        <el-table-column label="父应用">
            <template slot-scope="{ row }">
                <span v-if="!row.editing">{{ toShowingApp(row.parentApp) }}</span>
                <el-select v-else v-model="row.editingParent" filterable remote :remote-method="queryMatchedApps" @focus="queryMatchedApps(row.editingParent)" clearable size="small" placeholder="请选择父应用">
                    <el-option v-if="matchedApps === null && row.parentApp" :value="row.parentApp.appId" :label="toShowingApp(row.parentApp)" :key="row.parentApp.appId"></el-option>
                    <el-option v-for="app in matchedApps" :value="app.appId" :label="toShowingApp(app)" :key="app.appId"></el-option>
                </el-select>
            </template>
        </el-table-column>
        <el-table-column label="操作" header-align="center">
            <template slot-scope="{ row }">
                <el-row>
                    <el-col :span="12" style="text-align: center">
                        <el-tooltip v-if="!row.editing" content="修改" placement="top" :open-delay="1000" :hide-after="3000">
                            <el-button @click="startEditing(row)" type="primary" icon="el-icon-edit" size="small" circle></el-button>
                        </el-tooltip>
                        <template v-else>
                            <el-button-group>
                                <el-tooltip content="取消修改" placement="top" :open-delay="1000" :hide-after="3000">
                                    <el-button @click="row.editing = false" type="info" icon="el-icon-close" size="small" circle></el-button>
                                </el-tooltip>
                                <el-popover placement="top" v-model="row.savePopoverShowing">
                                    <p>确定保存修改？</p>
                                    <div style="text-align: right; margin: 0">
                                        <el-button size="mini" type="text" @click="row.savePopoverShowing = false">取消</el-button>
                                        <el-button type="primary" size="mini" @click="saveEditing(row)">确定</el-button>
                                    </div>
                                    <el-tooltip slot="reference" :disabled="row.savePopoverShowing" content="保存修改" placement="top" :open-delay="1000" :hide-after="3000">
                                        <el-button @click="row.savePopoverShowing = true" type="success" icon="el-icon-check" size="small" circle></el-button>
                                    </el-tooltip>
                                </el-popover>
                            </el-button-group>
                        </template>
                    </el-col>
                    <el-col :span="12" style="text-align: center">
                        <el-tooltip content="删除" placement="top" :open-delay="1000" :hide-after="3000">
                            <el-button @click="deleteApp(row)" type="danger" icon="el-icon-delete" size="small" circle></el-button>
                        </el-tooltip>
                    </el-col>
                </el-row>
            </template>
        </el-table-column>
    </el-table>
    <el-row style="margin-top: 10px">
        <el-col style="text-align: end">
            <el-pagination :total="totalApps" :current-page.sync="queryAppsForm.pageNo" :page-size.sync="queryAppsForm.pageSize" @current-change="queryApps" layout="total,prev,pager,next" small background></el-pagination>
        </el-col>
    </el-row>
    <el-dialog :visible.sync="addAppDialogVisible" :before-close="closeAddAppDialog" title="新增应用" width="40%">
        <el-form ref="addAppForm" :model="addAppForm" label-width="20%">
            <el-form-item label="应用id" prop="appId" :rules="[{required:true, message:'请输入应用id', trigger:'blur'}]">
                <el-input v-model="addAppForm.appId" clearable placeholder="请输入应用id" style="width: 90%"></el-input>
            </el-form-item>
            <el-form-item label="备注">
                <el-input v-model="addAppForm.memo" clearable placeholder="请输入备注" style="width: 90%"></el-input>
            </el-form-item>
            <el-form-item label="父应用" prop="parent">
                <el-select v-model="addAppForm.parent" filterable remote :remote-method="queryMatchedApps" @focus="queryMatchedApps(addAppForm.parent)" clearable placeholder="请选择父应用" style="width: 90%">
                    <el-option v-for="app in matchedApps" :value="app.appId" :label="toShowingApp(app)" :key="app.appId"></el-option>
                </el-select>
            </el-form-item>
        </el-form>
        <div slot="footer">
            <el-button @click="closeAddAppDialog">取消</el-button>
            <el-button type="primary" @click="addApp">提交</el-button>
        </div>
    </el-dialog>
</div>
`;


const appsComponent = {
    template: appsComponentTemplate,
    data: function () {
        return {
            queryAppsForm: {
                pageNo: 1,
                pageSize: 20,
                appId: null,
                parent: null
            },
            appsLoading: false,
            totalApps: 0,
            apps: [],
            matchedApps: null,
            addAppDialogVisible: false,
            addAppForm: {
                appId: null,
                memo: null,
                parent: null
            }
        };
    },
    created: function () {
        this.queryApps();
    },
    methods: {
        queryApps: function () {
            this.appsLoading = true;

            const theThis = this;
            this.doQueryApps(this.queryAppsForm, function (result) {
                theThis.totalApps = result.totalCount;
                theThis.apps = result.infos;
                theThis.apps.forEach(function (app) {
                    Vue.set(app, 'editing', false);
                    Vue.set(app, 'editingMemo', null);
                    Vue.set(app, 'editingParent', null);
                    Vue.set(app, 'parentApp', null);
                    if (app.parent) {
                        theThis.doFindApp(app.parent, function (parentApp) {
                            app.parentApp = parentApp;
                        });
                    }
                });
                theThis.appsLoading = false;
            }, function () {
                theThis.appsLoading = false;
            });
        },
        queryMatchedApps: function (appId) {
            const theThis = this;
            this.doQueryApps({
                pageNo: 1,
                pageSize: 100,
                appId: appId
            }, function (result) {
                theThis.matchedApps = result.infos;
            });
        },
        startEditing: function (app) {
            app.editing = true;
            app.editingMemo = app.memo;
            app.editingParent = app.parent;
            this.matchedApps = null;
        },
        saveEditing: function (app) {
            app.savePopoverShowing = false;

            const theThis = this;
            this.doAddOrModifyApp({
                appId: app.appId,
                memo: app.editingMemo,
                parent: app.editingParent
            }, function () {
                app.editing = false;
                app.memo = app.editingMemo;
                app.parent = app.editingParent;
                app.parentApp = null;
                if (app.parent) {
                    theThis.doFindApp(app.parent, function (parentApp) {
                        app.parentApp = parentApp;
                    });
                }
            });
        },
        deleteApp: function (app) {
            const theThis = this;
            Vue.prototype.$confirm('确定删除应用？', '警告', {type: 'warning'})
                .then(function () {
                    axios.post('../manage/app/deleteApp', {appId: app.appId})
                        .then(function (result) {
                            if (!result.success) {
                                Vue.prototype.$message.error(result.message);
                                return;
                            }
                            Vue.prototype.$message.success(result.message);
                            theThis.queryApps();
                        });
                });
        },
        addApp: function () {
            const theThis = this;
            this.$refs.addAppForm.validate(function (valid) {
                if (!valid) {
                    return;
                }
                theThis.doAddOrModifyApp(theThis.addAppForm, function () {
                    theThis.closeAddAppDialog();
                    theThis.queryApps();
                });
            })
        },
        closeAddAppDialog: function () {
            this.addAppDialogVisible = false;
            this.addAppForm.appId = null;
            this.addAppForm.memo = null;
            this.addAppForm.parent = null;
        },
        toShowingApp: function (app) {
            if (!app) {
                return '';
            }
            let text = app.appId;
            if (app.memo) {
                text += '（' + app.memo + '）';
            }
            return text;
        },
        doQueryApps: function (params, processResult, failCallback) {
            axios.get('../manage/app/queryApps', {params: params})
                .then(function (result) {
                    if (result.success) {
                        processResult(result);
                    } else {
                        Vue.prototype.$message.error(result.message);
                        if (failCallback) {
                            failCallback(result);
                        }
                    }
                });
        },
        doFindApp: function (appId, processApp) {
            axios.get('../manage/app/findApp', {
                params: {
                    appId: appId
                }
            }).then(function (result) {
                if (!result.success) {
                    Vue.prototype.$message.error(result.message);
                    return;
                }
                processApp(result.app);
            });
        },
        doAddOrModifyApp: function (params, successCallback) {
            axios.post('../manage/app/addOrModifyApp', params)
                .then(function (result) {
                    if (!result.success) {
                        Vue.prototype.$message.error(result.message);
                        return;
                    }
                    Vue.prototype.$message.success(result.message);
                    successCallback();
                });
        }
    }
};